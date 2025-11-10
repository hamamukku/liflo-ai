import { randomUUID } from "crypto";
import { RecordEntry } from "../../modules/records/model";
import { RecordRepository } from "../types";

type StoredRecord = RecordEntry & { userId: number };

export class MemoryRecordRepository implements RecordRepository {
  private records: StoredRecord[] = [];

  async list(userId: number): Promise<RecordEntry[]> {
    return this.records
      .filter((record) => record.userId === userId)
      .map(({ userId: _userId, ...rest }) => rest);
  }

  async create(userId: number, text: string): Promise<RecordEntry> {
    const now = new Date().toISOString();
    const record: StoredRecord = {
      id: randomUUID(),
      text,
      createdAt: now,
      userId,
    };
    this.records.push(record);
    const { userId: _userId, ...rest } = record;
    return rest;
  }
}
