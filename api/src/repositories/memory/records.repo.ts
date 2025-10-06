// in-memory records repo (ダミー)
export type RecordItem = { id: string; goalId: string; userId: string; date: string; challengeU: number; skillU: number };

const records = new Map<string, RecordItem>();

export const recordsMem = {
  async create(rec: Omit<RecordItem, "id">) {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    const r = { id, ...rec };
    records.set(id, r);
    return r;
  },
  async listByGoal(goalId: string) {
    return Array.from(records.values()).filter(r => r.goalId === goalId);
  },
};
