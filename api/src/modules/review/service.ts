import { RecordRepository } from "../../repositories/types";
import { RecordEntry } from "../records/model";

export interface ReviewStats {
  total: number;
  last7Days: number;
  last30Days: number;
  streak: number;
}

export class ReviewService {
  constructor(private readonly records: RecordRepository) {}

  async list(userId: number): Promise<RecordEntry[]> {
    const items = await this.records.list(userId);
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getStats(userId: number): Promise<ReviewStats> {
    const items = await this.records.list(userId);
    const now = new Date();

    const total = items.length;
    const last7Days = items.filter(
      (item) => now.getTime() - new Date(item.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
    ).length;
    const last30Days = items.filter(
      (item) => now.getTime() - new Date(item.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000,
    ).length;

    const datesWithRecords = new Set(
      items.map((item) => new Date(item.createdAt).toISOString().slice(0, 10)),
    );
    let streak = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);

    while (datesWithRecords.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      total,
      last7Days,
      last30Days,
      streak,
    };
  }
}
