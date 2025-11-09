import { prisma } from "./prisma.client.js";
import { mapGoal } from "./mappers.js";
import type { Goal, GoalStatus, IGoalsRepo } from "../index.js";

export const goalsPostgres: IGoalsRepo = {
  async list(userId: string): Promise<Goal[]> {
    const rows = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapGoal);
  },

  async create(input: { userId: string; title: string; status: GoalStatus; createdAt: string; updatedAt: string }): Promise<Goal> {
    const row = await prisma.goal.create({
      data: {
        userId: input.userId,
        title: input.title,
        status: input.status,
        createdAt: new Date(input.createdAt),
        updatedAt: new Date(input.updatedAt),
      } as any,
    });
    return mapGoal(row);
  },

  async updateStatus(userId: string, id: string, status: GoalStatus): Promise<Goal> {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) throw new Error("goal_not_found");
    if (existing.userId !== userId) throw new Error("goal_forbidden");
    const row = await prisma.goal.update({
      where: { id },
      data: { status, updatedAt: new Date() } as any,
    });
    return mapGoal(row);
  },

  async delete(userId: string, id: string): Promise<void> {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) throw new Error("goal_not_found");
    if (existing.userId !== userId) throw new Error("goal_forbidden");
    await prisma.goal.delete({ where: { id } });
  },
};
