const records = new Map();
export const recordsMem = {
    async create(rec) {
        const id = crypto.randomUUID?.() ?? String(Date.now());
        const r = { id, ...rec };
        records.set(id, r);
        return r;
    },
    async listByGoal(goalId) {
        return Array.from(records.values()).filter(r => r.goalId === goalId);
    },
};
