// api/src/controllers/records.controller.ts
import { Request, Response, NextFunction } from "express";
import * as svc from "../services/records.service.js";

// logger（あれば使う／無ければ console）
let info: (...a: any[]) => void = console.info.bind(console);
let warn: (...a: any[]) => void = console.warn.bind(console);
let error: (...a: any[]) => void = console.error.bind(console);
try {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import("firebase-functions/logger").then((m) => {
    info  = (m.info  ?? console.info ).bind(console);
    warn  = (m.warn  ?? console.warn ).bind(console);
    error = (m.error ?? console.error).bind(console);
  });
} catch {}

/** POST /records */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = (req as any).userId ?? "u1"; // dev フォールバック
    const out = await svc.createRecord(uid, req.body ?? {});
    return res.status(201).json(out);
  } catch (e: any) {
    error("records.create failed", { message: e?.message, stack: e?.stack });
    return next(e);
  }
}

/** GET /records?from=YYYY-MM-DD&to=YYYY-MM-DD[&goalId=...] */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = (req as any).userId ?? "u1";
    const { from, to, goalId } = (req.query ?? {}) as any;
    info("records.list called", { uid, from, to, goalId });
    const out = await svc.listRecords(uid, { from, to, goalId });
    return res.status(200).json(out);
  } catch (e: any) {
    error("records.list failed", { message: e?.message, stack: e?.stack });
    return next(e);
  }
}
