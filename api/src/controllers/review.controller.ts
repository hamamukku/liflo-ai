// api/src/controllers/review.controller.ts
import { Request, Response, NextFunction } from "express";
import * as svc from "../services/review.service.js";

// logger（存在すれば使用、無ければ console フォールバック）
let info: (...a: any[]) => void = console.info.bind(console);
let warn: (...a: any[]) => void = console.warn.bind(console);
let error: (...a: any[]) => void = console.error.bind(console);
try {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import("firebase-functions/logger").then((m) => {
    info = (m.info ?? console.info).bind(console);
    warn = (m.warn ?? console.warn).bind(console);
    error = (m.error ?? console.error).bind(console);
  });
} catch {}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = (req as any).userId ?? "u1"; // devフォールバック
    const { from, to, goalId } = (req.query ?? {}) as any;

    info("/review called", { uid, query: { from, to, goalId } });

    const result = await svc.getReview(uid, { from, to, goalId });
    return res.status(200).json(result);
  } catch (e: any) {
    error("review.summary failed", { message: e?.message, stack: e?.stack });
    return next(e);
  }
}
