// web/src/app/api.ts
// Liflo Web API bridge — 最終互換・確定版（修正版）
// - GET/HEAD の Content-Type を送らない（プリフライト最小化）
// - listGoals: 常に {items: Goal[]} を返す（配列/オブジェクト両対応）
// - saveGoal : create / status-update ユニオン（POST優先・PUT互換フォールバック）
// - createRecord: camel →（400/422/404）→ snake 自動フォールバック
// - getReview : 応答を堅牢に正規化（avgChallenge/avgSkill, avgUser/avgAI の数値/オブジェクト両対応、states/flowPct…/items から再構成）
// - MODE     : 実行モードを外部から参照可能に

/* ================== env/runtime ================== */
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "";
const USE_MOCK: boolean = !API_BASE_URL || import.meta.env.VITE_USE_MOCK === "1";
export const MODE = { USE_MOCK, BASE_URL: API_BASE_URL };

/* ================== utils ================== */
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = (p = "id_") => p + Math.random().toString(36).slice(2, 10);
const num = (x: any, d = 0) => (typeof x === "number" && isFinite(x) ? x : Number.isFinite(+x) ? +x : d);

/* ================== types ================== */
export type GoalStatus = "active" | 1000 | 999;
export type Goal = {
  id: string;
  content: string;
  status: GoalStatus;          // 必須
  category?: string;
  reasonU?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RecordInput = {
  goalId: string;
  date: string;                // YYYY-MM-DD
  challengeU: 1|2|3|4|5|6|7;
  skillU: 1|2|3|4|5|6|7;
  reasonU?: string;
};

export type RecordResp = RecordInput & {
  id: string;
  aiChallenge?: number;
  aiSkill?: number;
  aiComment?: string;
  regoalAI?: string;
};

/* ================== LS keys ================== */
const LS = { token: "token", user: "user", goals: "liflo_goals", records: "liflo_records" };

/* ================== fetch helpers ================== */
function isFormLike(b: any) {
  return (typeof FormData !== "undefined" && b instanceof FormData) ||
         (typeof URLSearchParams !== "undefined" && b instanceof URLSearchParams);
}
function shouldSetJSON(method: string, body: any) {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return false;
  if (!body) return false;
  if (isFormLike(body)) return false;
  return true; // 純JSON送信のみ付与
}

async function apiRes(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {});
  if (shouldSetJSON(method, init.body)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  } else {
    headers.delete("Content-Type"); // GET/HEAD では付けない
  }
  const t = localStorage.getItem(LS.token);
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const u = new URL(API_BASE_URL + path);
  if (method === "GET") u.searchParams.set("_t", String(Date.now())); // サーバ側が無視するので安全

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(u.toString(), { ...init, method, headers, signal: controller.signal, cache: "no-store" });
  } finally { clearTimeout(to); }
}

async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiRes(path, init);
  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text as any; } })() : null;

  if (!res.ok) {
    let msg = (isJSON && (data as any)?.message) || (data as any)?.error || res.statusText || `HTTP ${res.status}`;
    if (res.status === 401 && path.startsWith("/auth/login")) msg = "ニックネームまたは暗証番号が正しくありません。";
    throw Object.assign(new Error(String(msg)), { status: res.status, data });
  }
  return data as T;
}

/* ================== 正規化（Goals） ================== */
function normalizeStatus(raw: any): GoalStatus {
  const s = raw?.status;
  if (s === "active" || s === "ACTIVE" || s === 0 || s === "0" || raw?.is_active === true) return "active";
  if (s === 1000 || s === "1000") return 1000;
  if (s === 999  || s === "999")  return 999;
  return "active";
}
function toGoal(raw: any): Goal {
  return {
    id: String(raw?.id ?? raw?.goalId ?? raw?.goal_id ?? raw?.uuid ?? uid("goal_")),
    content: raw?.content ?? raw?.title ?? raw?.name ?? raw?.text ?? "",
    status: normalizeStatus(raw),
    category: raw?.category,
    reasonU: raw?.reasonU ?? raw?.reason_u,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  };
}
function pickArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.items)) return x.items;
  return [];
}

/* ================== Auth ================== */
export async function login(nickname: string, pin: string): Promise<{ token: string; userId: string }> {
  if (USE_MOCK) {
    await delay();
    const token = "mock_" + uid("");
    const userId = "user_" + (nickname || "guest");
    localStorage.setItem(LS.token, token);
    localStorage.setItem(LS.user, JSON.stringify({ userId, nickname }));
    return { token, userId };
  }
  const any = await api<any>("/auth/login", { method: "POST", body: JSON.stringify({ nickname, pin }) });
  const token = any?.token ?? any?.customToken ?? any?.accessToken;
  const userId = any?.userId ?? any?.uid;
  if (!token || !userId) throw new Error("ログインに失敗しました");
  localStorage.setItem(LS.token, token);
  localStorage.setItem(LS.user, JSON.stringify({ userId, nickname }));
  return { token, userId };
}

export async function register(nickname: string, pin: string): Promise<{ ok: true }> {
  if (USE_MOCK) { await delay(); return { ok: true }; }
  const res = await apiRes("/auth/register", { method: "POST", body: JSON.stringify({ nickname, pin }) });
  if (res.status === 404 || res.status === 405) return { ok: true };
  if (!res.ok) {
    let msg = "登録に失敗しました";
    try { const d = await res.json(); msg = d?.message || msg; } catch {}
    throw new Error(msg);
  }
  return { ok: true };
}

export function getStoredUser(): { userId: string; nickname?: string } | null {
  try { const raw = localStorage.getItem(LS.user); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function clearSession() { localStorage.removeItem(LS.token); localStorage.removeItem(LS.user); }

/* ================== Goals ================== */
export async function listGoals(): Promise<{ items: Goal[] }> {
  if (USE_MOCK) {
    await delay();
    return { items: JSON.parse(localStorage.getItem(LS.goals) || "[]") };
  }
  const data = await api<any>("/goals", { method: "GET" });
  return { items: pickArray(data).map(toGoal) };
}

type SaveGoalCreate = { content: string; category?: string; status?: GoalStatus };
type SaveGoalUpdate = { id: string; status: 1000 | 999; reasonU: string; content?: string; category?: string };
export type SaveGoalParams = SaveGoalCreate | SaveGoalUpdate;
export type GoalInput = SaveGoalParams;

export async function saveGoal(input: SaveGoalParams): Promise<Goal> {
  if (USE_MOCK) {
    await delay();
    const items: Goal[] = JSON.parse(localStorage.getItem(LS.goals) || "[]");
    if ("id" in input) {
      const next = items.map(g => g.id === input.id ? { ...g, ...input, updatedAt: new Date().toISOString() } : g);
      localStorage.setItem(LS.goals, JSON.stringify(next));
      return next.find(g => g.id === (input as SaveGoalUpdate).id)!;
    } else {
      const g: Goal = { id: uid("goal_"), content: input.content, status: input.status ?? "active",
        category: input.category, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      localStorage.setItem(LS.goals, JSON.stringify([g, ...items])); return g;
    }
  }

  // POST /goals（create/更新の両方をまず試す）
  const bodyForPost =
    "id" in input
      ? { id: input.id, status: input.status, reason_u: (input as SaveGoalUpdate).reasonU,
          ...(input.content ? { content: input.content } : {}), ...(input.category ? { category: input.category } : {}) }
      : { content: (input as SaveGoalCreate).content, category: (input as SaveGoalCreate).category, status: (input as SaveGoalCreate).status ?? "active" };

  let res = await apiRes("/goals", { method: "POST", body: JSON.stringify(bodyForPost) });

  // レガシー互換：PUT /goals/:id
  if (!res.ok && [404, 405, 501].includes(res.status) && "id" in input) {
    res = await apiRes(`/goals/${(input as SaveGoalUpdate).id}`, { method: "PUT", body: JSON.stringify({
      content: (input as SaveGoalUpdate).content, category: (input as SaveGoalUpdate).category,
      status: (input as SaveGoalUpdate).status ?? "active", reasonU: (input as SaveGoalUpdate).reasonU,
    }) });
  }

  const isJSON = res.headers.get("content-type")?.includes("application/json");
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text as any; } })() : null;
  if (!res.ok) {
    const msg = (isJSON && (data as any)?.message) || res.statusText || "保存に失敗しました";
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return toGoal((data as any)?.item ?? data);
}

/* ================== Records ================== */
export async function createRecord(input: RecordInput): Promise<RecordResp> {
  if (USE_MOCK) {
    await delay();
    const aiComment =
      input.challengeU - input.skillU >= 1 ? "挑戦が先行。足場を固めて段階化を。（モック）" :
      input.skillU - input.challengeU >= 1 ? "能力が先行。難度を一段上げてみよう。（モック）" :
      "よい集中。継続条件を保って。（モック）";
    return { ...input, id: uid("rec_"), aiComment };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = localStorage.getItem(LS.token); if (t) headers.Authorization = `Bearer ${t}`;

  const post = async (body: any) => {
    const res = await fetch(`${API_BASE_URL}/records`, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text as any; } })() : null;
    return { ok: res.ok, status: res.status, statusText: res.statusText, data };
    };

  // 1st: camelCase
  let r = await post({ goalId: input.goalId, date: input.date, challengeU: input.challengeU, skillU: input.skillU,
                       ...(input.reasonU ? { reasonU: input.reasonU } : {}) });
  if (r.ok) return r.data;

  // 2nd: snake_case fallback
  if ([400, 404, 422].includes(r.status)) {
    r = await post({ goal_id: input.goalId, date: input.date, challenge_u: input.challengeU, skill_u: input.skillU,
                     ...(input.reasonU ? { reason_u: input.reasonU } : {}) });
    if (r.ok) return r.data;
  }
  throw new Error(String((r.data as any)?.message || (r.data as any)?.error || r.statusText || `HTTP ${r.status}`));
}

/* ================== Review ================== */
/** 4象限分類（challenge/skill の閾値=4） */
function classifyState(challengeU: number, skillU: number) {
  const hiC = num(challengeU) >= 4;
  const hiS = num(skillU) >= 4;
  if (hiC && hiS) return "flow" as const;
  if (hiC && !hiS) return "anxiety" as const;
  if (!hiC && hiS) return "boredom" as const;
  return "apathy" as const;
}

/** 応答を“UIが使いやすい一形”に正規化して返す */
export async function getReview(params: { from: string; to: string; goalId?: string }) {
  if (USE_MOCK) {
    await delay();
    return {
      count: 0,
      avgUser: { challenge: 0, skill: 0 },
      avgAI:   { challenge: 0, skill: 0 },
      states: { flow: { count: 0, pct: 0 }, anxiety: { count: 0, pct: 0 }, boredom: { count: 0, pct: 0 }, apathy: { count: 0, pct: 0 } },
      notes: "モック要約",
      items: [],
    };
  }

  const qs = new URLSearchParams({ from: params.from, to: params.to, ...(params.goalId ? { goalId: params.goalId } : {}) });
  const resp = await api<any>(`/review?${qs.toString()}`, { method: "GET" });

  // --- 件数 ---
  const count = num(resp?.count ?? resp?.total, 0);

  // --- 平均（どんな形でも吸収） ---
  // 1) 現行サーバ: avgChallenge/avgSkill（数値）
  // 2) 互換：avgUser/avgAI（数値）→ オブジェクトに包む
  // 3) 旧UI：avgUser: {challenge, skill} / avgAI: {challenge, skill}
  // 4) 最後の砦：items[] から平均再計算
  let avgUserC = 0, avgUserS = 0;
  let avgAIC = 0,   avgAIS = 0;

  if (typeof resp?.avgChallenge === "number" || typeof resp?.avgSkill === "number") {
    avgUserC = num(resp.avgChallenge, 0);
    avgUserS = num(resp.avgSkill, 0);
  } else if (typeof resp?.avgUser === "number" || typeof resp?.avgAI === "number") {
    avgUserC = num(resp.avgUser, 0);
    avgUserS = num(resp.avgAI ?? resp.avgSkill, 0);
  } else if (resp?.avgUser && typeof resp.avgUser?.challenge === "number") {
    avgUserC = num(resp.avgUser.challenge, 0);
    avgUserS = num(resp.avgUser.skill, 0);
  }

  if (typeof resp?.avgAI === "number" && typeof resp?.avgUser === "number") {
    // 互換が数値のときの AI 側（同値にする）
    avgAIC = num(resp.avgUser, 0);
    avgAIS = num(resp.avgAI, 0);
  } else if (resp?.avgAI && typeof resp.avgAI?.challenge === "number") {
    avgAIC = num(resp.avgAI.challenge, 0);
    avgAIS = num(resp.avgAI.skill, 0);
  } else {
    // サーバ現行は「ユーザー平均=avgChallenge/avgSkill」。AI平均が別フィールドで来ない構成もあるため合わせる。
    avgAIC = avgUserC;
    avgAIS = avgUserS;
  }

  // items からの再計算（平均が 0 で items がある場合）
  const items = Array.isArray(resp?.items) ? resp.items : [];
  if ((avgUserC === 0 && avgUserS === 0) && items.length > 0) {
    const sC = items.reduce((a: number, it: any) => a + num(it?.challengeU), 0);
    const sS = items.reduce((a: number, it: any) => a + num(it?.skillU), 0);
    avgUserC = items.length ? +(sC / items.length).toFixed(2) : 0;
    avgUserS = items.length ? +(sS / items.length).toFixed(2) : 0;
    avgAIC = avgAIC || avgUserC;
    avgAIS = avgAIS || avgUserS;
  }

  // --- states（count/pct を必ず揃える） ---
  let states = resp?.states;
  if (!states || typeof states !== "object") states = {};

  // pct がトップレベル（flowPct 等）にある場合は states を構築
  const fp = num(resp?.flowPct, NaN), ap = num(resp?.anxietyPct, NaN),
        bp = num(resp?.boredomPct, NaN), zp = num(resp?.apathyPct, NaN);
  const hasTopPct = [fp, ap, bp, zp].some((v) => !Number.isNaN(v));

  const fromStates = {
    flow:    { count: num(states?.flow?.count, 0),    pct: num(states?.flow?.pct, hasTopPct && count ? Math.round((fp * count) / 100) : 0) },
    anxiety: { count: num(states?.anxiety?.count, 0), pct: num(states?.anxiety?.pct, hasTopPct && count ? Math.round((ap * count) / 100) : 0) },
    boredom: { count: num(states?.boredom?.count, 0), pct: num(states?.boredom?.pct, hasTopPct && count ? Math.round((bp * count) / 100) : 0) },
    apathy:  { count: num(states?.apathy?.count, 0),  pct: num(states?.apathy?.pct, hasTopPct && count ? Math.round((zp * count) / 100) : 0) },
  };

  // どれも 0 で、items があるなら items を分類して count/pct を構築
  const sumCounts = fromStates.flow.count + fromStates.anxiety.count + fromStates.boredom.count + fromStates.apathy.count;
  let finalStates = fromStates;
  if (sumCounts === 0 && items.length > 0) {
    const bins = { flow: 0, anxiety: 0, boredom: 0, apathy: 0 };
    for (const it of items) bins[classifyState(it?.challengeU, it?.skillU)] += 1;
    const pct = (n: number) => (items.length ? +((n * 100) / items.length).toFixed(1) : 0);
    finalStates = {
      flow:    { count: bins.flow,    pct: pct(bins.flow) },
      anxiety: { count: bins.anxiety, pct: pct(bins.anxiety) },
      boredom: { count: bins.boredom, pct: pct(bins.boredom) },
      apathy:  { count: bins.apathy,  pct: pct(bins.apathy) },
    };
  }

  return {
    count,
    avgUser: { challenge: avgUserC, skill: avgUserS },
    avgAI:   { challenge: avgAIC,   skill: avgAIS   },
    states:  finalStates,
    notes:   resp?.notes ?? resp?.summary ?? "",
    items,
  };
}

/* ================== helpers ================== */
export const helpers = { today: () => new Date().toISOString().slice(0,10) };
