import { randomUUID } from "node:crypto";
const records = new Map();
export const recordsMem = {
    async create(entry) {
        const id = randomUUID();
        const record = { id, ...entry };
        records.set(id, record);
        return record;
    },
    async list(userId, opts) {
        const order = (opts?.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
        const limit = opts?.limit ?? records.size;
        const items = Array.from(records.values())
            .filter((r) => r.userId === userId)
            .sort((a, b) => (order === "asc" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
        return items.slice(0, limit);
    },
    async findById(userId, id) {
        const record = records.get(id) ?? null;
        if (!record || record.userId !== userId)
            return null;
        return record;
    },
    async delete(userId, id) {
        const record = records.get(id);
        if (!record)
            throw new Error("record_not_found");
        if (record.userId !== userId)
            throw new Error("record_forbidden");
        records.delete(id);
    },
};
