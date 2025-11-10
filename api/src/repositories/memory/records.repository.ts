import { randomUUID } from "crypto";
import { RecordEntry } from "../../modules/records/model";
import { RecordRepository } from "../types";

export class MemoryRecordRepository implements RecordRepository {
  private records: RecordEntry[] = [];

  async list(): Promise<RecordEntry[]> {
    return [...this.records];
  }

  async create(text: string): Promise<RecordEntry> {
    const now = new Date().toISOString();
    const record: RecordEntry = {
      id: randomUUID(),
      text,
      createdAt: now,
    };
    this.records.push(record);
    return record;
  }
}
