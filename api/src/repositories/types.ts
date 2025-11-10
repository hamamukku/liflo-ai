import { Goal, GoalStatus } from "../modules/goals/model";
import { RecordEntry } from "../modules/records/model";

export interface GoalRepository {
  list(userId: number): Promise<Goal[]>;
  create(userId: number, title: string): Promise<Goal>;
  updateStatus(userId: number, id: string, status: GoalStatus): Promise<Goal | null>;
  delete(userId: number, id: string): Promise<boolean>;
}

export interface RecordRepository {
  list(userId: number): Promise<RecordEntry[]>;
  create(userId: number, text: string): Promise<RecordEntry>;
}

export interface RepositoryBundle {
  goals: GoalRepository;
  records: RecordRepository;
}
