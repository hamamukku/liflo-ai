const users = new Map();
export const usersMem = {
    async findById(id) {
        return users.get(id) ?? null;
    },
    async create(nickname) {
        const id = crypto.randomUUID?.() ?? String(Date.now());
        const u = { id, nickname };
        users.set(id, u);
        return u;
    },
};
