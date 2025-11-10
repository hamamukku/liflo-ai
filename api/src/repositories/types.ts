import { Goal, GoalStatus } from "../modules/goals/model";
import { RecordEntry } from "../modules/records/model";

export interface GoalRepository {
  list(): Promise<Goal[]>;
  create(title: string): Promise<Goal>;
  updateStatus(id: string, status: GoalStatus): Promise<Goal | null>;
  delete(id: string): Promise<boolean>;
}

export interface RecordRepository {
  list(): Promise<RecordEntry[]>;
  create(text: string): Promise<RecordEntry>;
}

export interface RepositoryBundle {
  goals: GoalRepository;
  records: RecordRepository;
}
