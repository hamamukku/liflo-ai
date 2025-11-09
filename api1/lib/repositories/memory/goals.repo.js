import { randomUUID } from "node:crypto";
const store = new Map();
export const goalsMem = {
    async list(userId) {
        return Array.from(store.values()).filter((goal) => goal.userId === userId);
    },
    async create(input) {
        const id = randomUUID();
        const goal = { id, ...input };
        store.set(id, goal);
        return goal;
    },
    async updateStatus(userId, id, status) {
        const goal = store.get(id);
        if (!goal)
            throw new Error("goal_not_found");
        if (goal.userId !== userId)
            throw new Error("goal_forbidden");
        const updated = { ...goal, status, updatedAt: new Date().toISOString() };
        store.set(id, updated);
        return updated;
    },
    async delete(userId, id) {
        const goal = store.get(id);
        if (!goal)
            throw new Error("goal_not_found");
        if (goal.userId !== userId)
            throw new Error("goal_forbidden");
        store.delete(id);
    },
};
