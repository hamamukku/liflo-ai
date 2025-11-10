import { RecordRepository } from "../../repositories/types";
import { RecordEntry } from "./model";

export class RecordsService {
  constructor(private readonly repository: RecordRepository) {}

  list(userId: number): Promise<RecordEntry[]> {
    return this.repository.list(userId);
  }

  create(userId: number, text: string): Promise<RecordEntry> {
    return this.repository.create(userId, text);
  }
}
