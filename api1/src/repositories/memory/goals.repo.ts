import { randomUUID } from "node:crypto";
import type { IGoalsRepo, Goal, GoalStatus } from "../index.js";

const store = new Map<string, Goal>();

export const goalsMem: IGoalsRepo = {
  async list(userId) {
    return Array.from(store.values()).filter((goal) => goal.userId === userId);
  },

  async create(input) {
    const id = randomUUID();
    const goal: Goal = { id, ...input };
    store.set(id, goal);
    return goal;
  },

  async updateStatus(userId, id, status: GoalStatus) {
    const goal = store.get(id);
    if (!goal) throw new Error("goal_not_found");
    if (goal.userId !== userId) throw new Error("goal_forbidden");
    const updated: Goal = { ...goal, status, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  async delete(userId, id) {
    const goal = store.get(id);
    if (!goal) throw new Error("goal_not_found");
    if (goal.userId !== userId) throw new Error("goal_forbidden");
    store.delete(id);
  },
};
