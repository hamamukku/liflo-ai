import { randomUUID } from "crypto";
import { Goal, GoalStatus } from "../../modules/goals/model";
import { GoalRepository } from "../types";

export class MemoryGoalRepository implements GoalRepository {
  private goals: Goal[] = [];

  async list(): Promise<Goal[]> {
    return [...this.goals];
  }

  async create(title: string): Promise<Goal> {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: randomUUID(),
      title,
      status: "active",
      createdAt: now,
    };
    this.goals.unshift(goal);
    return goal;
  }

  async updateStatus(id: string, status: GoalStatus): Promise<Goal | null> {
    const index = this.goals.findIndex((goal) => goal.id === id);
    if (index === -1) {
      return null;
    }
    this.goals[index] = {
      ...this.goals[index],
      status,
    };
    return this.goals[index];
  }

  async delete(id: string): Promise<boolean> {
    const prevLength = this.goals.length;
    this.goals = this.goals.filter((goal) => goal.id !== id);
    return this.goals.length < prevLength;
  }
}
