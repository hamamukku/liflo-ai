import { randomUUID } from "crypto";
import { Goal, GoalStatus } from "../../modules/goals/model";
import { GoalRepository } from "../types";

type StoredGoal = Goal & { userId: number };

export class MemoryGoalRepository implements GoalRepository {
  private goals: StoredGoal[] = [];

  async list(userId: number): Promise<Goal[]> {
    return this.goals
      .filter((goal) => goal.userId === userId)
      .map(({ userId: _userId, ...rest }) => rest);
  }

  async create(userId: number, title: string): Promise<Goal> {
    const now = new Date().toISOString();
    const goal: StoredGoal = {
      id: randomUUID(),
      title,
      status: "active",
      createdAt: now,
      userId,
    };
    this.goals.unshift(goal);
    const { userId: _userId, ...rest } = goal;
    return rest;
  }

  async updateStatus(userId: number, id: string, status: GoalStatus): Promise<Goal | null> {
    const index = this.goals.findIndex((goal) => goal.id === id && goal.userId === userId);
    if (index === -1) {
      return null;
    }
    this.goals[index] = {
      ...this.goals[index],
      status,
    };
    const { userId: _userId, ...rest } = this.goals[index];
    return rest;
  }

  async delete(userId: number, id: string): Promise<boolean> {
    const prevLength = this.goals.length;
    this.goals = this.goals.filter((goal) => !(goal.id === id && goal.userId === userId));
    return this.goals.length < prevLength;
  }
}
