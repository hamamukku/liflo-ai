export type GoalStatus = "active" | "done" | "cancelled";

export type Goal = {
  id: string;
  title: string;
  status: GoalStatus;
  createdAt: string;
};

export type RecordEntry = {
  id: string;
  text: string;
  createdAt: string;
};

export type ReviewStats = {
  total: number;
  last7Days: number;
  last30Days: number;
  streak: number;
};

export type FlowTips = {
  tips: string[];
};

export type AuthUser = {
  id: number;
  nickname: string;
  createdAt: string;
};

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export async function lifloFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.status === "error") {
    const message = json?.message ?? "Request failed";
    throw new Error(message);
  }

  return json.data as T;
}

export const goalsApi = {
  list: () => lifloFetch<Goal[]>("/goals"),
  create: (payload: { title: string }) =>
    lifloFetch<Goal>("/goals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStatus: (id: string, status: GoalStatus) =>
    lifloFetch<Goal>(`/goals/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) =>
    lifloFetch<{ ok: boolean }>(`/goals/${id}`, {
      method: "DELETE",
    }),
};

export const recordsApi = {
  list: () => lifloFetch<RecordEntry[]>("/records"),
  create: (payload: { text: string }) =>
    lifloFetch<RecordEntry>("/records", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const reviewApi = {
  list: () => lifloFetch<RecordEntry[]>("/review"),
  stats: () => lifloFetch<ReviewStats>("/review/stats"),
};

export const flowApi = {
  tips: () => lifloFetch<FlowTips>("/flow/tips"),
};

export const authApi = {
  login: (payload: { nickname: string; pin: string }) =>
    lifloFetch<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  signup: (payload: { nickname: string; pin: string }) =>
    lifloFetch<{ user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    lifloFetch<{ ok: boolean }>("/auth/logout", {
      method: "POST",
    }),
  me: () => lifloFetch<AuthUser>("/auth/me"),
};
