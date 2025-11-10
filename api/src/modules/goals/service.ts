import { AppError } from "../../utils/http";
import { GoalRepository } from "../../repositories/types";
import { Goal, GoalStatus } from "./model";

export class GoalsService {
  constructor(private readonly repository: GoalRepository) {}

  list(userId: number): Promise<Goal[]> {
    return this.repository.list(userId);
  }

  create(userId: number, title: string): Promise<Goal> {
    return this.repository.create(userId, title);
  }

  async updateStatus(userId: number, id: string, status: GoalStatus): Promise<Goal> {
    const updated = await this.repository.updateStatus(userId, id, status);
    if (!updated) {
      throw new AppError("Goal not found.", 404);
    }
    return updated;
  }

  async delete(userId: number, id: string): Promise<void> {
    const deleted = await this.repository.delete(userId, id);
    if (!deleted) {
      throw new AppError("Goal not found.", 404);
    }
  }
}
