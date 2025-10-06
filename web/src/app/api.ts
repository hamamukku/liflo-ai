// src/app/api.ts
// モック⇄実API兼用の共通ブリッジ。UIは変更しない前提で、I/F揺れをここで吸収。

// ---- env & runtime ----
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const USE_MOCK = !BASE_URL || import.meta.env.VITE_USE_MOCK === "1";

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
  category?: string;        // ← 型追加（GoalFormPageのTS2353対策）
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
async function apiRequest(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  const token = localStorage.getItem(LS.token);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(BASE_URL + path, { ...options, headers, signal: controller.signal });
    const isJSON = res.headers.get("content-type")?.includes("application/json");
    const data = isJSON ? await res.json() : await res.text();

    if (!res.ok) {
      let msg = (isJSON && (data as any)?.message) || "エラーが発生しました";
      if (res.status === 401 && path.startsWith("/auth/login")) {
        msg = "ニックネームまたは暗証番号が正しくありません。";
      }
      throw new Error(msg);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
 * Auth
 * =======================*/
export async function login(nickname: string, pin: string): Promise<{ token: string; userId: string }> {
  if (USE_MOCK) {
    await delay();
    const token = "mock_" + uid("");
    const userId = "user_" + (nickname || "guest");
    localStorage.setItem(LS.token, token);
    localStorage.setItem(LS.user, JSON.stringify({ userId, nickname: nickname || "ゲスト" }));
    return { token, userId };
  }
  const res = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ nickname, pin }),
  });
  const any = res as any;
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
  const headers = new Headers({ "Content-Type": "application/json" });
  const res = await fetch(BASE_URL + "/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify({ nickname, pin }),
  });
  if (res.status === 404 || res.status === 405) return { ok: true };
  if (!res.ok) {
    let msg = "登録に失敗しました";
    try {
      const data = await res.json();
      msg = data?.message || msg;
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
  return apiRequest("/goals", { method: "GET" });
}

export async function saveGoal(input: Partial<Goal>): Promise<Goal> {
  if (USE_MOCK) {
    await delay();
    const items: Goal[] = JSON.parse(localStorage.getItem(LS.goals) || "[]");
    if (input.id) {
      const next = items.map((g) => (g.id === input.id ? { ...g, ...input, updatedAt: new Date().toISOString() } : g));
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
  return apiRequest(path, { method, body: JSON.stringify(input) });
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
  return apiRequest("/records", { method: "POST", body: JSON.stringify(input) });
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
    return { count: filtered.length, avgUser: { challenge: cU, skill: sU }, avgAI: { challenge: cA, skill: sA }, notes: "モック要約" };
  }
  const qs = new URLSearchParams({ from: params.from, to: params.to, ...(params.goalId ? { goalId: params.goalId } : {}) });
  return apiRequest(`/review?${qs.toString()}`, { method: "GET" });
}

// ユーティリティ（UIで使う）
export const helpers = { today };
export const MODE = { USE_MOCK, BASE_URL };
