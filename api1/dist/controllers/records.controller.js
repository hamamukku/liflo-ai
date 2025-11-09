import { randomUUID } from "node:crypto";
import * as recordsService from "../services/records.service.js";
import { logSink } from "../config/providers.js";
function getReqId(req) {
    return req.id ?? (typeof randomUUID === "function" ? randomUUID() : String(Date.now()));
}
function requireUserId(req) {
    const userId = req.user?.id || req.userId;
    if (!userId) {
        const e = new Error("unauthorized");
        e.status = 401;
        throw e;
    }
    return String(userId);
}
function getClientMeta(req) {
    const ip = (req.headers["x-forwarded-for"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";
    const ua = req.headers["user-agent"] || "";
    return { ip, ua };
}
function toCS(n) {
    const v = Number(n);
    if (!Number.isInteger(v) || v < 1 || v > 7) {
        const e = new Error("bad_request_cs_out_of_range");
        e.status = 400;
        throw e;
    }
    return v;
}
/**
 * POST /records
 * Body: { goalId: string; date: string; challengeU: 1..7; skillU: 1..7; reasonU?: string }
 * Res:  201 with created record including AI evaluation (aiChallenge, aiSkill, aiComment, regoalAI?)
 */
export async function create(req, res, next) {
    const started = Date.now();
    const requestId = getReqId(req);
    const { ip, ua } = getClientMeta(req);
    try {
        const userId = requireUserId(req);
        const goalId = String(req.body?.goalId ?? "");
        const date = String(req.body?.date ?? "");
        if (!goalId || !date) {
            const e = new Error("bad_request");
            e.status = 400;
            throw e;
        }
        const input = {
            goalId,
            date,
            challengeU: toCS(req.body?.challengeU),
            skillU: toCS(req.body?.skillU),
            reasonU: req.body?.reasonU ?? undefined,
        };
        const created = await recordsService.create(userId, input);
        res.status(201).json(created);
        // 監査ログ（自由記述や aiComment は記録しない）
        void logSink.append([
            {
                ts: new Date().toISOString(),
                requestId,
                userId,
                endpoint: "/records",
                method: "POST",
                event: "RECORD_CREATED",
                status: "success",
                latencyMs: Date.now() - started,
                ip,
                ua,
                recordId: created.id,
                goalId: created.goalId,
                date: created.date,
                challengeU: created.challengeU,
                skillU: created.skillU,
                aiChallenge: created.aiChallenge,
                aiSkill: created.aiSkill,
                statusCode: 201,
            },
        ]);
    }
    catch (err) {
        next(err);
    }
}
// 互換エクスポート（routes が records.create を参照。createRecord を参照するコードにも対応）
export const createRecord = create;
