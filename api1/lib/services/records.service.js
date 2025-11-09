import { ai, repos } from "../config/providers.js";
import { HttpError } from "../utils/http.js";
async function generateAiComment(text) {
    const snippet = text.slice(0, 240);
    try {
        const res = await ai.evaluateRecordWithOpenAI({
            goalId: "liflo-record",
            date: new Date().toISOString().slice(0, 10),
            challengeU: 4,
            skillU: 4,
            reasonU: snippet,
        });
        return res?.aiComment ?? null;
    }
    catch (error) {
        console.warn("[records] AI provider not available", error?.message);
        return null;
    }
}
export async function listRecords(userId) {
    const items = (await repos.records.list(userId, { order: "desc", limit: 50 }));
    return items;
}
export async function createRecord(userId, payload) {
    const text = payload?.text?.trim?.() ?? "";
    if (!text) {
        throw new HttpError(400, "Text is required");
    }
    const createdAt = new Date().toISOString();
    const aiComment = await generateAiComment(text);
    const created = (await repos.records.create({
        userId,
        text,
        aiComment,
        createdAt,
    }));
    return created;
}
export async function getRecord(userId, id) {
    const record = (await repos.records.findById(userId, id));
    if (!record) {
        throw new HttpError(404, "Record not found");
    }
    return record;
}
export async function deleteRecord(userId, id) {
    try {
        await repos.records.delete(userId, id);
    }
    catch (err) {
        const code = err?.message ?? "";
        if (code === "record_not_found") {
            throw new HttpError(404, "Record not found");
        }
        if (code === "record_forbidden") {
            throw new HttpError(403, "Record does not belong to the current user");
        }
        throw err instanceof HttpError ? err : new HttpError(500, "Failed to delete record");
    }
}
