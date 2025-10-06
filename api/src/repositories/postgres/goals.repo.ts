
// src/repositories/postgres/goals.repo.ts
import { prisma } from './prisma.client.js';
import { mapGoal } from './mappers.js';
import type { IGoalsRepo, Goal, GoalStatus } from '../index.js';

export const goalsPostgres: IGoalsRepo = {
  async list(userId: string): Promise<Goal[]> {
    const rows = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapGoal);
  },

  async create(input: { userId: string; content: string; status: GoalStatus; reasonU?: string }): Promise<Goal> {
    const row = await prisma.goal.create({
      data: {
        userId: input.userId,
        content: input.content,
        status: input.status as unknown as number, // Prisma 側が number の場合
        reasonU: input.reasonU ?? null,
      },
    });
    return mapGoal(row);
  },

  async update(id: string, patch: Partial<Goal> & { userId?: string }): Promise<Goal> {
    const data: any = {};
    if (patch.content !== undefined) data.content = patch.content;
    if (patch.status  !== undefined) data.status  = patch.status as unknown as number;
    if (patch.reasonU !== undefined) data.reasonU = patch.reasonU;

    const row = await prisma.goal.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
    return mapGoal(row);
  },
};
