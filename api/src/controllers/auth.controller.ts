// api/src/controllers/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import * as authService from "../services/auth.service.js";
import { logSink } from "../config/providers.js";

function getReqId(req: Request): string {
  return (
    (req as any).id ??
    (typeof randomUUID === "function" ? randomUUID() : String(Date.now()))
  );
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
 * POST /auth/login
 * Body: { nickname: string, pin: string }
 * Res:  { customToken: string, userId: string }
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const requestId = getReqId(req);
  const { ip, ua } = getClientMeta(req);

  try {
    const { nickname, pin } = (req.body ?? {}) as {
      nickname?: string;
      pin?: string;
    };

    // 入力検証（validateミドルウェア併用前提の最小チェック）
    if (!nickname || !pin) {
      const err: any = new Error("bad_request");
      err.status = 400;
      throw err;
    }

    // サービス署名に合わせて2引数で呼び出す
    const result = await authService.login(nickname, pin); // { customToken, userId }

    res.status(200).json(result);

    // 監査ログ（PII: nickname/pin 非記録）
    void logSink.append([
      {
        ts: new Date().toISOString(),
        requestId,
        userId: result.userId,
        endpoint: "/auth/login",
        method: "POST",
        event: "LOGIN_SUCCESS",
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
