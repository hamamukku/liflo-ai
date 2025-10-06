// api/src/controllers/records.controller.ts
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import * as recordsService from "../services/records.service.js";
import { logSink } from "../config/providers.js";

function getReqId(req: Request): string {
  return (
    (req as any).id ??
    (typeof randomUUID === "function" ? randomUUID() : String(Date.now()))
  );
}

function requireUserId(req: Request): string {
  const userId = (req as any).user?.id || (req as any).userId;
  if (!userId) {
    const e: any = new Error("unauthorized");
    e.status = 401;
    throw e;
  }
  return String(userId);
}

function getClientMeta(req: Request) {
  const ip =
    ((req.headers["x-forwarded-for"] as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0] ||
    (req.socket as any)?.remoteAddress ||
    req.ip ||
    "";
  const ua = (req.headers["user-agent"] as string) || "";
  return { ip, ua };
}

/**
 * POST /records
 * Body: { goalId: string; date: string; challengeU: 1..7; skillU: 1..7; reasonU?: string }
 * Res:  201 with created record including AI evaluation (aiChallenge, aiSkill, aiComment, regoalAI?)
 */
export async function createRecord(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const requestId = getReqId(req);
  const { ip, ua } = getClientMeta(req);

  try {
    const userId = requireUserId(req);

    // CS(1..7) ユニオンに合わせて数値化＋型キャスト
    const challenge = Number((req.body as any)?.challengeU);
    const skill = Number((req.body as any)?.skillU);

    const input: {
      goalId: string;
      date: string;
      challengeU: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      skillU: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      reasonU?: string;
    } = {
      goalId: String((req.body as any)?.goalId ?? ""),
      date: String((req.body as any)?.date ?? ""),
      challengeU: challenge as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      skillU: skill as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      reasonU: (req.body as any)?.reasonU ?? undefined,
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
  } catch (err) {
    next(err);
  }
}
