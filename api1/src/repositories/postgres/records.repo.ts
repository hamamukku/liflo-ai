import { prisma } from "./prisma.client.js";
import { mapRecord } from "./mappers.js";
import type { IRecordsRepo, RecordEntry } from "../index.js";

export const recordsPostgres: IRecordsRepo = {
  async create(input: Omit<RecordEntry, "id">): Promise<RecordEntry> {
    const row = await prisma.record.create({
      data: {
        userId: input.userId,
        text: input.text,
        aiComment: input.aiComment,
        createdAt: new Date(input.createdAt),
      } as any,
    });
    return mapRecord(row);
  },

  async list(userId: string, opts?: { limit?: number; order?: "asc" | "desc" }): Promise<RecordEntry[]> {
    const order = (opts?.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const rows = await prisma.record.findMany({
      where: { userId },
      orderBy: { createdAt: order as "asc" | "desc" },
      take: opts?.limit,
    });
    return rows.map(mapRecord);
  },

  async findById(userId: string, id: string): Promise<RecordEntry | null> {
    const row = await prisma.record.findFirst({
      where: { id, userId },
    });
    return row ? mapRecord(row) : null;
  },

  async delete(userId: string, id: string): Promise<void> {
    const result = await prisma.record.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new Error("record_not_found");
  },
};
