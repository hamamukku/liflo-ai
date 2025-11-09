import type { CreateGoalInput, Goal, GoalStatus } from "../models/goal.js";
import { repos } from "../config/providers.js";
import { HttpError } from "../utils/http.js";

const VALID_STATUS: GoalStatus[] = ["active", "done", "cancelled"];

function normalizeTitle(raw: string): string {
  return raw?.trim?.() ?? "";
}

function mapGoal(goal: any): Goal {
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title ?? goal?.content ?? "",
    status: VALID_STATUS.includes(goal.status) ? goal.status : "active",
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

function handleRepoError(err: unknown): never {
  const code = (err as any)?.message ?? "";
  if (code === "goal_not_found") {
    throw new HttpError(404, "Goal not found");
  }
  if (code === "goal_forbidden") {
    throw new HttpError(403, "Goal does not belong to the current user");
  }
  throw err instanceof HttpError ? err : new HttpError(500, "Failed to update goal");
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const items = (await repos.goals.list(userId)) as Goal[];
  return items.map(mapGoal);
}

export async function createGoal(userId: string, payload: CreateGoalInput): Promise<Goal> {
  const title = normalizeTitle(payload.title);
  if (!title) {
    throw new HttpError(400, "Title is required");
  }
  const now = new Date().toISOString();
  const created = (await repos.goals.create({
    userId,
    title,
    status: "active",
    createdAt: now,
    updatedAt: now,
  })) as Goal;
  return mapGoal(created);
}

export async function updateGoalStatus(userId: string, id: string, status: GoalStatus): Promise<Goal> {
  if (!VALID_STATUS.includes(status)) {
    throw new HttpError(400, "Invalid status");
  }
  try {
    const updated = (await repos.goals.updateStatus(userId, id, status)) as Goal;
    return mapGoal(updated);
  } catch (err) {
    handleRepoError(err);
  }
}

export async function removeGoal(userId: string, id: string): Promise<void> {
  try {
    await repos.goals.delete(userId, id);
  } catch (err) {
    handleRepoError(err);
  }
}
