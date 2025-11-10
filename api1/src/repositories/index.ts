import type { Goal, GoalStatus } from "../models/goal.js";
import type { RecordEntry } from "../models/record.js";
import type { User } from "../models/user.js";

export type { Goal, GoalStatus } from "../models/goal.js";
export type { RecordEntry } from "../models/record.js";
export type { User } from "../models/user.js";

export interface IGoalsRepo {
  list(userId: string): Promise<Goal[]>;
  create(input: {
    userId: string;
    title: string;
    status: GoalStatus;
    createdAt: string;
    updatedAt: string;
  }): Promise<Goal>;
  updateStatus(userId: string, id: string, status: GoalStatus): Promise<Goal>;
  delete(userId: string, id: string): Promise<void>;
}

export interface IRecordsRepo {
  create(input: Omit<RecordEntry, "id">): Promise<RecordEntry>;
  list(userId: string, opts?: { limit?: number; order?: "asc" | "desc" }): Promise<RecordEntry[]>;
  findById(userId: string, id: string): Promise<RecordEntry | null>;
  delete(userId: string, id: string): Promise<void>;
}

export interface IUsersRepo {
  findByNickname(nickname: string): Promise<User | null>;
  create(input: { nickname: string; pin: string }): Promise<User>;
}
