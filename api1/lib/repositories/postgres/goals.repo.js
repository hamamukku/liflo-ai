import { prisma } from "./prisma.client.js";
import { mapGoal } from "./mappers.js";
export const goalsPostgres = {
    async list(userId) {
        const rows = await prisma.goal.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return rows.map(mapGoal);
    },
    async create(input) {
        const row = await prisma.goal.create({
            data: {
                userId: input.userId,
                title: input.title,
                status: input.status,
                createdAt: new Date(input.createdAt),
                updatedAt: new Date(input.updatedAt),
            },
        });
        return mapGoal(row);
    },
    async updateStatus(userId, id, status) {
        const existing = await prisma.goal.findUnique({ where: { id } });
        if (!existing)
            throw new Error("goal_not_found");
        if (existing.userId !== userId)
            throw new Error("goal_forbidden");
        const row = await prisma.goal.update({
            where: { id },
            data: { status, updatedAt: new Date() },
        });
        return mapGoal(row);
    },
    async delete(userId, id) {
        const existing = await prisma.goal.findUnique({ where: { id } });
        if (!existing)
            throw new Error("goal_not_found");
        if (existing.userId !== userId)
            throw new Error("goal_forbidden");
        await prisma.goal.delete({ where: { id } });
    },
};
