// api/src/routes/goals.routes.ts
import { Router } from "express";
import * as goals from "../controllers/goals.controller.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import {
  goalCreateSchema,
  goalUpdateSchema,
  goalIdParamSchema,
} from "../schemas/goal.schema.js";

const r = Router();

/**
 * GET /goals — 一覧
 * controller 側は 200 で配列を返す
 */
r.get("/", goals.list);

/**
 * POST /goals — 新規作成
 * - 必須: content
 * - 任意: status ("active" のみ受容)
 * - 未知キー: Zod .strip() により静かに除去 → {content, status:"active"} でも 400 にしない
 * controller 側で 201 Created を返す想定
 */
r.post("/", validateBody(goalCreateSchema), goals.create);

/**
 * PUT /goals/:id — 更新/達成(1000)/中止(999)
 * - :id は goalIdParamSchema で検証
 * - body は goalUpdateSchema（active 更新では reasonU 不可、1000/999 遷移では reasonU 必須）
 * - 未知キーは .strip() で除去
 */
r.put(
  "/:id",
  validateParams(goalIdParamSchema),
  validateBody(goalUpdateSchema),
  goals.update
);

export default r;
// 併用パターンに備えるなら： export { r as goalsRouter };
