// src/app/api.ts
// モック⇄実API兼用の共通ブリッジ。UIは変更しない前提で、I/F揺れをここで吸収。

// ---- env & runtime ----
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
// 末尾スラッシュ除去して正規化
const BASE_URL = RAW_BASE.replace(/\/+$/, "");
// モック判定：BASE_URL未設定 or VITE_USE_MOCK=1
const USE_MOCK = !BASE_URL || import.meta.env.VITE_USE_MOCK === "1";

// リージョン警告（デプロイが asia-northeast1 前提の場合のヒント）
if (BASE_URL && /us-central1/.test(BASE_URL)) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api.ts] VITE_API_BASE_URL が us-central1 を向いています。Functions を asia-northeast1 でデプロイしている場合は通信エラー（CORS含む）の原因になります。",
    { BASE_URL }
  );
}

// ---- small utils ----
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix = "id_") => prefix + Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

// ---- types ----
export type GoalStatus = "active" | 1000 | 999;

export type Goal = {
  id: string;
  content: string;
  status: GoalStatus;
  category?: string; // ← 型追加（GoalFormPageのTS2353対策）
  reasonU?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RecordInput = {
  goalId: string;
  date: string; // YYYY-MM-DD
  challengeU: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  skillU: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  reasonU?: string;
};

export type RecordResp = RecordInput & {
  id: string;
  aiChallenge?: number;
  aiSkill?: number;
  aiComment?: string;
  regoalAI?: string;
};

// ---- storage keys ----
const LS = {
  token: "token",
  user: "user",
  goals: "liflo_goals",
  records: "liflo_records",
};

// ---- fetch wrapper ----
type ReqInitX = RequestInit & { json?: any };

function joinPath(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function apiRequest<T = any>(path: string, init: ReqInitX = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error("APIのBASE_URLが未設定です（.env の VITE_API_BASE_URL を確認）");
  }

  const url = joinPath(BASE_URL, path);
  const headers = new Headers(init.headers || {});
  const token = localStorage.getItem(LS.token);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (init.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      signal: controller.signal,
    });

    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    const data = isJSON ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
      const msg =
        (isJSON && (data as any)?.message) ||
        `${res.status} ${res.statusText}` ||
        "エラーが発生しました";
      const e = new Error(msg) as any;
      e.status = res.status;
      e.url = url;
      e.details = data;
      throw e;
    }

    return (data as T) ?? (undefined as any);
  } catch (err: any) {
    // タイムアウト or ネットワーク/CORS の分かりやすいメッセージ
    if (err?.name === "AbortError") {
      throw new Error("リクエストがタイムアウトしました（回線またはサーバ負荷の可能性）");
    }
    if (err instanceof TypeError) {
      const hint = /us-central1/.test(BASE_URL)
        ? "（Functions のリージョンが asia-northeast1 なら .env を修正してください）"
        : "";
      throw new Error(`ネットワークまたはCORSエラーによりサーバーに接続できません。${hint}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
 * Auth
 * =======================*/
export async function login(
  nickname: string,
  pin: string
): Promise<{ token: string; userId: string }> {
  if (USE_MOCK) {
    await delay();
    const token = "mock_" + uid("");
    const userId = "user_" + (nickname || "guest");
    localStorage.setItem(LS.token, token);
    localStorage.setItem(LS.user, JSON.stringify({ userId, nickname: nickname || "ゲスト" }));
    return { token, userId };
  }

  const any = await apiRequest<any>("/auth/login", { method: "POST", json: { nickname, pin } });
  // devモード：customToken でも直に使える（AUTH_MODE=dev）
  // 本番（AUTH_MODE=firebase）では customToken → IDトークン交換が必要（別途実装）
  const token = any?.token ?? any?.customToken ?? any?.accessToken;
  const userId = any?.userId ?? any?.uid;
  if (!token || !userId) throw new Error("ログインに失敗しました");
  localStorage.setItem(LS.token, token);
  localStorage.setItem(LS.user, JSON.stringify({ userId, nickname }));
  return { token, userId };
}

// /auth/register がなくても落ちないフェイルセーフ
export async function register(nickname: string, pin: string): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay();
    return { ok: true };
  }

  const url = joinPath(BASE_URL, "/auth/register");
  const headers = new Headers({ "Content-Type": "application/json", Accept: "application/json" });
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ nickname, pin }) });

  if (res.status === 404 || res.status === 405) return { ok: true };
  if (!res.ok) {
    let msg = "登録に失敗しました";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        msg = data?.message || msg;
      }
    } catch {}
    throw new Error(msg);
  }
  return { ok: true };
}

export function getStoredUser(): { userId: string; nickname?: string } | null {
  try {
    const raw = localStorage.getItem(LS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function clearSession() {
  localStorage.removeItem(LS.token);
  localStorage.removeItem(LS.user);
}

/* =========================
 * Goals
 * =======================*/
export async function listGoals(): Promise<{ items: Goal[] }> {
  if (USE_MOCK) {
    await delay();
    const items: Goal[] = JSON.parse(localStorage.getItem(LS.goals) || "[]");
    return { items };
  }

  // ← ここを“常に { items } を返す”ように正規化（配列返却にも対応）
  const raw = await apiRequest<any>("/goals", { method: "GET" });
  const items: Goal[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  return { items };
}

export async function saveGoal(input: Partial<Goal>): Promise<Goal> {
  if (USE_MOCK) {
    await delay();
    const items: Goal[] = JSON.parse(localStorage.getItem(LS.goals) || "[]");
    if (input.id) {
      const next = items.map((g) =>
        g.id === input.id ? { ...g, ...input, updatedAt: new Date().toISOString() } : g
      );
      localStorage.setItem(LS.goals, JSON.stringify(next));
      return next.find((g) => g.id === input.id)!;
    } else {
      const g: Goal = {
        id: uid("goal_"),
        content: input.content || "",
        status: (input.status as GoalStatus) ?? "active",
        category: input.category,
        reasonU: input.reasonU,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LS.goals, JSON.stringify([g, ...items]));
      return g;
    }
  }
  const path = input.id ? `/goals/${input.id}` : "/goals";
  const method = input.id ? "PUT" : "POST";
  return apiRequest<Goal>(path, { method, json: input });
}

/* =========================
 * Records
 * =======================*/
export async function createRecord(input: RecordInput): Promise<RecordResp> {
  if (USE_MOCK) {
    await delay();
    const recs: RecordResp[] = JSON.parse(localStorage.getItem(LS.records) || "[]");
    const aiComment =
      input.challengeU - input.skillU >= 1
        ? "挑戦が先行。足場を固めて段階化を。（モック）"
        : input.skillU - input.challengeU >= 1
        ? "能力が先行。難度を一段上げてみよう。（モック）"
        : "よい集中。継続条件を保って。（モック）";
    const r: RecordResp = { ...input, id: uid("rec_"), aiComment };
    recs.push(r);
    localStorage.setItem(LS.records, JSON.stringify(recs));
    return r;
  }
  return apiRequest<RecordResp>("/records", { method: "POST", json: input });
}

/* =========================
 * Review
 * =======================*/
export async function getReview(params: { from: string; to: string; goalId?: string }) {
  if (USE_MOCK) {
    await delay();
    const recs: RecordResp[] = JSON.parse(localStorage.getItem(LS.records) || "[]");
    const filtered = recs.filter((r) => r.date >= params.from && r.date <= params.to);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const cU = avg(filtered.map((r) => r.challengeU));
    const sU = avg(filtered.map((r) => r.skillU));
    const cA = avg(filtered.map((r) => r.aiChallenge || r.challengeU));
    const sA = avg(filtered.map((r) => r.aiSkill || r.skillU));
    return {
      count: filtered.length,
      avgUser: { challenge: cU, skill: sU },
      avgAI: { challenge: cA, skill: sA },
      notes: "モック要約",
    };
  }
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    ...(params.goalId ? { goalId: params.goalId } : {}),
  });
  return apiRequest(`/review?${qs.toString()}`, { method: "GET" });
}

// ユーティリティ（UIで使う）
export const helpers = { today };
export const MODE = { USE_MOCK, BASE_URL };
