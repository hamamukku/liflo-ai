// api/src/controllers/records.controller.ts
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import * as recordsService from "../services/records.service.js";
import { logSink } from "../config/providers.js";

function getReqId(req: Request): string {
  return (req as any).id ?? (typeof randomUUID === "function" ? randomUUID() : String(Date.now()));
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
      .map((s: string) => s.trim())
      .filter(Boolean)[0] ||
    (req.socket as any)?.remoteAddress ||
    req.ip ||
    "";
  const ua = (req.headers["user-agent"] as string) || "";
  return { ip, ua };
}

type CS = 1 | 2 | 3 | 4 | 5 | 6 | 7;
function toCS(n: unknown): CS {
  const v = Number(n);
  if (!Number.isInteger(v) || v < 1 || v > 7) {
    const e: any = new Error("bad_request_cs_out_of_range");
    e.status = 400;
    throw e;
  }
  return v as CS;
}

/**
 * POST /records
 * Body: { goalId: string; date: string; challengeU: 1..7; skillU: 1..7; reasonU?: string }
 * Res:  201 with created record including AI evaluation (aiChallenge, aiSkill, aiComment, regoalAI?)
 */
export async function create(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const requestId = getReqId(req);
  const { ip, ua } = getClientMeta(req);

  try {
    const userId = requireUserId(req);

    const goalId = String((req.body as any)?.goalId ?? "");
    const date = String((req.body as any)?.date ?? "");
    if (!goalId || !date) {
      const e: any = new Error("bad_request");
      e.status = 400;
      throw e;
    }

    const input: {
      goalId: string;
      date: string;
      challengeU: CS;
      skillU: CS;
      reasonU?: string;
    } = {
      goalId,
      date,
      challengeU: toCS((req.body as any)?.challengeU),
      skillU: toCS((req.body as any)?.skillU),
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
        recordId: (created as any).id,
        goalId: (created as any).goalId,
        date: (created as any).date,
        challengeU: (created as any).challengeU,
        skillU: (created as any).skillU,
        aiChallenge: (created as any).aiChallenge,
        aiSkill: (created as any).aiSkill,
        statusCode: 201,
      },
    ]);
  } catch (err) {
    next(err);
  }
}

// 互換エクスポート（routes が records.create を参照。createRecord を参照するコードにも対応）
export const createRecord = create;
