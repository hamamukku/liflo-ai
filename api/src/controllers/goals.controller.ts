import type { Request, Response, NextFunction } from "express";
import * as goalsService from "../services/goals.service.js";
import { logSink } from "../config/providers.js";

type GoalStatus = "active" | 1000 | 999;

function getReqId(req: Request): string {
  return (req as any).id ?? crypto.randomUUID?.() ?? String(Date.now());
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
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.socket && (req.socket as any).remoteAddress) ||
    req.ip ||
    "";
  const ua = (req.headers["user-agent"] as string) || "";
  return { ip, ua };
}

/**
 * GET /goals
 */
export async function listGoals(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const requestId = getReqId(req);
  const { ip, ua } = getClientMeta(req);

  try {
    const userId = requireUserId(req);
    const items = await goalsService.list(userId);
    res.status(200).json({ items });

    void logSink.append([
      {
        ts: new Date().toISOString(),
        requestId,
        userId,
        endpoint: "/goals",
        method: "GET",
        event: "GOAL_LIST",
        status: "success",
        latencyMs: Date.now() - started,
        ip,
        ua,
      },
    ]);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /goals
 * Body: { content: string, status?: GoalStatus, reasonU?: string }
 */
export async function createGoal(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const requestId = getReqId(req);
  const { ip, ua } = getClientMeta(req);

  try {
    const userId = requireUserId(req);
    const input = req.body as {
      content: string;
      status?: GoalStatus;
      reasonU?: string;
    };

    const created = await goalsService.create(userId, input);
    res.status(201).json(created);

    void logSink.append([
      {
        ts: new Date().toISOString(),
        requestId,
        userId,
        endpoint: "/goals",
        method: "POST",
        event: "GOAL_CREATED",
        status: "success",
        latencyMs: Date.now() - started,
        ip,
        ua,
        goalId: created.id,
        // テキスト本文（reasonU）は記録しない
        statusCode: 201,
      },
    ]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /goals/:id
 * Body: { content?: string, status?: GoalStatus, reasonU?: string }
 */
export async function updateGoal(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const requestId = getReqId(req);
  const { ip, ua } = getClientMeta(req);

  try {
    const userId = requireUserId(req);
    const id = req.params.id;
    if (!id) {
      const e: any = new Error("bad_request");
      e.status = 400;
      throw e;
    }

    const patch = req.body as Partial<{
      content: string;
      status: GoalStatus;
      reasonU: string;
    }>;

    const updated = await goalsService.update(userId, id, patch);
    res.status(200).json(updated);

    const hasReason =
      typeof (patch as any)?.reasonU === "string" && (patch as any)?.reasonU.length > 0;

    void logSink.append([
      {
        ts: new Date().toISOString(),
        requestId,
        userId,
        endpoint: `/goals/${id}`,
        method: "PUT",
        event: "GOAL_UPDATED",
        status: "success",
        latencyMs: Date.now() - started,
        ip,
        ua,
        goalId: updated.id,
        // ドメイン補助情報（本文は残さない）
        note:
          updated.status === 1000 || updated.status === 999
            ? `terminal:${updated.status}; hasReason=${hasReason}`
            : undefined,
      },
    ]);
  } catch (err) {
    next(err);
  }
}
