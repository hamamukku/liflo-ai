const store = new Map();
export const goalsMem = {
    async list(userId) {
        return Array.from(store.values()).filter(g => g.userId === userId);
    },
    async create(goal) {
        const id = crypto.randomUUID?.() ?? String(Date.now());
        const g = { id, ...goal };
        store.set(id, g);
        return g;
    },
    async update(id, patch) {
        const ex = store.get(id);
        if (!ex)
            throw new Error("not_found");
        const upd = { ...ex, ...patch };
        store.set(id, upd);
        return upd;
    },
};
