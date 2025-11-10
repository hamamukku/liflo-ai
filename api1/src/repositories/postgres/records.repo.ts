import { prisma } from "./prisma.client.js";
import { mapRecord } from "./mappers.js";
import type { IRecordsRepo, RecordEntry } from "../index.js";

export const recordsPostgres: IRecordsRepo = {
  async create(input: Omit<RecordEntry, "id">): Promise<RecordEntry> {
    const row = await prisma.record.create({
      data: {
        text: input.text,
        aiComment: input.aiComment ?? null,
        createdAt: new Date(input.createdAt),
      },
    });
    return mapRecord(row);
  },

  async list(_userId: string, opts?: { limit?: number; order?: "asc" | "desc" }): Promise<RecordEntry[]> {
    const order = (opts?.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const rows = await prisma.record.findMany({
      orderBy: { createdAt: order as "asc" | "desc" },
      take: opts?.limit,
    });
    return rows.map(mapRecord);
  },

  async findById(_userId: string, id: string): Promise<RecordEntry | null> {
    const row = await prisma.record.findUnique({ where: { id } });
    return row ? mapRecord(row) : null;
  },

  async delete(_userId: string, id: string): Promise<void> {
    const result = await prisma.record.delete({ where: { id } }).catch(() => null);
    if (!result) throw new Error("record_not_found");
  },
};
