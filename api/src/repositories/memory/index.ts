import { RepositoryBundle } from "../types";
import { MemoryGoalRepository } from "./goals.repository";
import { MemoryRecordRepository } from "./records.repository";

export const createMemoryRepositories = (): RepositoryBundle => ({
  goals: new MemoryGoalRepository(),
  records: new MemoryRecordRepository(),
});
