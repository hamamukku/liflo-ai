// api/src/routes/records.routes.ts
import { Router, RequestHandler } from "express";
import * as ctrl from "../controllers/records.controller.js";

// 余分なクエリ（例: _t）を無視して Zod/厳格スキーマに弾かれないようにする
const sanitizeListQuery: RequestHandler = (req, _res, next) => {
  const q = (req.query ?? {}) as Record<string, unknown>;
  const keep: Record<string, unknown> = {};
  if (q.from !== undefined) keep.from = q.from;
  if (q.to !== undefined) keep.to = q.to;
  const goalId = q.goalId ?? q.goal_id;
  if (goalId !== undefined) keep.goalId = goalId;
  (req as any).query = keep;
  next();
};

const r = Router();

// 作成（POST /records）
r.post("/", ctrl.create);

// 一覧（GET /records?from=YYYY-MM-DD&to=YYYY-MM-DD[&goalId=...]）
// ※ review の下流で使う読み出し用。不要なら残さなくても可。
r.get("/", sanitizeListQuery, ctrl.list);

export default r;
