import { repos } from "../config/providers.js";
const DAY_MS = 86_400_000;
function startOfDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function toYmd(date) {
    return date.toISOString().slice(0, 10);
}
function diffDays(a, b) {
    return Math.abs(Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS));
}
function normalizeRecords(records) {
    return [...records].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
function countWithin(records, days) {
    if (records.length === 0)
        return 0;
    const today = startOfDay(new Date());
    const limit = today.getTime() - (days - 1) * DAY_MS;
    return records.filter((record) => startOfDay(new Date(record.createdAt)).getTime() >= limit).length;
}
function computeStreak(records) {
    if (records.length === 0)
        return 0;
    const dates = new Set(records.map((r) => toYmd(startOfDay(new Date(r.createdAt)))));
    let streak = 0;
    let cursor = startOfDay(new Date());
    while (dates.has(toYmd(cursor))) {
        streak += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return streak;
}
export async function getReviewFeed(userId) {
    const items = (await repos.records.list(userId, { order: "desc", limit: 100 }));
    return {
        items,
        total: items.length,
    };
}
export async function getReviewStats(userId) {
    const items = normalizeRecords((await repos.records.list(userId, { order: "desc", limit: 365 })));
    if (items.length === 0) {
        return {
            totalEntries: 0,
            last7Days: 0,
            last30Days: 0,
            currentStreakDays: 0,
            lastRecordedAt: null,
            averagePerWeek: 0,
        };
    }
    const lastRecordedAt = items[0]?.createdAt ?? null;
    const last7Days = countWithin(items, 7);
    const last30Days = countWithin(items, 30);
    const currentStreakDays = computeStreak(items);
    const newest = startOfDay(new Date(items[0].createdAt));
    const oldest = startOfDay(new Date(items[items.length - 1].createdAt));
    const spanDays = Math.max(1, diffDays(newest, oldest) + 1);
    const averagePerWeek = Number(((items.length / spanDays) * 7).toFixed(2));
    return {
        totalEntries: items.length,
        last7Days,
        last30Days,
        currentStreakDays,
        lastRecordedAt,
        averagePerWeek,
    };
}
