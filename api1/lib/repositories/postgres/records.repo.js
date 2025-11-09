import { prisma } from "./prisma.client.js";
import { mapRecord } from "./mappers.js";
export const recordsPostgres = {
    async create(input) {
        const row = await prisma.record.create({
            data: {
                userId: input.userId,
                text: input.text,
                aiComment: input.aiComment,
                createdAt: new Date(input.createdAt),
            },
        });
        return mapRecord(row);
    },
    async list(userId, opts) {
        const order = (opts?.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
        const rows = await prisma.record.findMany({
            where: { userId },
            orderBy: { createdAt: order },
            take: opts?.limit,
        });
        return rows.map(mapRecord);
    },
    async findById(userId, id) {
        const row = await prisma.record.findFirst({
            where: { id, userId },
        });
        return row ? mapRecord(row) : null;
    },
    async delete(userId, id) {
        const result = await prisma.record.deleteMany({ where: { id, userId } });
        if (result.count === 0)
            throw new Error("record_not_found");
    },
};
