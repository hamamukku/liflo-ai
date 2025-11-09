// src/repositories/postgres/goals.repo.ts
import { prisma } from './prisma.client.js';
import { mapGoal } from './mappers.js';
export const goalsPostgres = {
    async list(userId) {
        const rows = await prisma.goal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(mapGoal);
    },
    async create(input) {
        const row = await prisma.goal.create({
            data: {
                userId: input.userId,
                content: input.content,
                status: input.status, // Prisma 側が number の場合
                reasonU: input.reasonU ?? null,
            },
        });
        return mapGoal(row);
    },
    async update(id, patch) {
        const data = {};
        if (patch.content !== undefined)
            data.content = patch.content;
        if (patch.status !== undefined)
            data.status = patch.status;
        if (patch.reasonU !== undefined)
            data.reasonU = patch.reasonU;
        const row = await prisma.goal.update({
            where: { id },
            data: { ...data, updatedAt: new Date() },
        });
        return mapGoal(row);
    },
};
