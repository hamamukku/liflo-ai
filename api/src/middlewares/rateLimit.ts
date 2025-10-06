// api/src/middlewares/rateLimit.ts
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit() {
  // ✅ 型変換して数値にする
  const limit = Number(env.RATE_LIMIT_MAX); // 例: 60 req
  const windowMs = Number(env.RATE_LIMIT_WINDOW_MS); // 例: 60000 ms

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/healthz") return next(); // 任意: ヘルスチェック免除

    const now = Date.now();
    const key =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString() ||
      "ip:unknown";

    const b = buckets.get(key);

    // ✅ windowMs を number として扱う
    if (!b || b.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    b.count++;
    if (b.count > limit) {
      res.setHeader("Retry-After", Math.ceil((b.resetAt - now) / 1000));
      return res.status(429).json({ error: "too_many_requests" });
    }
    return next();
  };
}
