// simple in-memory goals repo (ダミー)
export type Goal = { id: string; userId: string; content: string; status?: number };

const store = new Map<string, Goal>();

export const goalsMem = {
  async list(userId: string) {
    return Array.from(store.values()).filter(g => g.userId === userId);
  },
  async create(goal: Omit<Goal, "id">) {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    const g = { id, ...goal };
    store.set(id, g);
    return g;
  },
  async update(id: string, patch: Partial<Goal>) {
    const ex = store.get(id);
    if (!ex) throw new Error("not_found");
    const upd = { ...ex, ...patch };
    store.set(id, upd);
    return upd;
  },
};
