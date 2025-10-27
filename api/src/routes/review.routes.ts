// api/src/routes/review.routes.ts
import { Router, RequestHandler } from "express";
import * as review from "../controllers/review.controller.js";

const r = Router();

/**
 * クエリ正規化:
 * - 許可: from, to, goalId（snake互換: goal_id）
 * - それ以外（例: _t）は破棄してZod等の厳格スキーマがあっても安全
 */
const sanitizeReviewQuery: RequestHandler = (req, _res, next) => {
  const q = (req.query ?? {}) as Record<string, unknown>;
  const keep: Record<string, unknown> = {};

  if (q.from !== undefined) keep.from = q.from;
  if (q.to !== undefined) keep.to = q.to;

  const goalId = q.goalId ?? q.goal_id;
  if (goalId !== undefined) keep.goalId = goalId;

  (req as any).query = keep;
  next();
};

// GET /review?from=YYYY-MM-DD&to=YYYY-MM-DD[&goalId=...]
r.get("/", sanitizeReviewQuery, review.summary);

export default r;
