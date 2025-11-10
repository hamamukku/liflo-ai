import type { Goal, GoalStatus, RecordEntry, User } from "../index.js";

const toIsoDateTime = (value: Date | string): string =>
  typeof value === "string" ? value : new Date(value).toISOString();

export const mapGoal = (row: any): Goal => ({
  id: row.id,
  userId: row.userId,
  title: row.title ?? row.content ?? "",
  status: (row.status as GoalStatus) ?? "active",
  createdAt: toIsoDateTime(row.createdAt),
  updatedAt: toIsoDateTime(row.updatedAt),
});

export const mapUser = (row: any): User => ({
  id: row.id,
  nickname: row.nickname,
  pin: row.pin,
  createdAt: toIsoDateTime(row.createdAt),
});

export const mapRecord = (row: any): RecordEntry => ({
  id: row.id,
  text: row.text ?? "",
  aiComment: row.aiComment ?? null,
  createdAt: toIsoDateTime(row.createdAt),
});
