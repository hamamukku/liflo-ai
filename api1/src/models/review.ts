import type { RecordEntry } from "./record.js";

export interface ReviewFeed {
  items: RecordEntry[];
  total: number;
}

export interface ReviewStats {
  totalEntries: number;
  last7Days: number;
  last30Days: number;
  currentStreakDays: number;
  lastRecordedAt: string | null;
  averagePerWeek: number;
}
