const toIsoDateTime = (value) => typeof value === "string" ? value : new Date(value).toISOString();
export const mapGoal = (row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title ?? row.content ?? "",
    status: row.status ?? "active",
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
});
export const mapUser = (row) => ({
    id: row.id,
    nickname: row.nickname,
    pinHash: row.pinHash,
    createdAt: toIsoDateTime(row.createdAt),
});
export const mapRecord = (row) => ({
    id: row.id,
    userId: row.userId,
    text: row.text ?? row.reasonU ?? "",
    aiComment: row.aiComment ?? null,
    createdAt: toIsoDateTime(row.createdAt ?? row.date),
});
