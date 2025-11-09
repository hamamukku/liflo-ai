import { Router } from 'express';
import * as goals from '../controllers/goals.controller.js';
import { validateBody, validateParams } from '../middlewares/validate.js';
import { goalCreateSchema, goalUpdateSchema, goalIdParamSchema } from '../schemas/goal.schema.js';
const r = Router();
// GET /goals  — 一覧（現I/Fは配列返却：controllerが200で配列を返す）
r.get('/', goals.list);
// POST /goals  — 新規（content必須）
r.post('/', validateBody(goalCreateSchema), goals.create);
// PUT /goals/:id  — 更新/達成(1000)/中止(999)
// ※ 1000/999 遷移時は reasonU 必須（zod＋service層で二重チェック）
r.put('/:id', validateParams(goalIdParamSchema), validateBody(goalUpdateSchema), goals.update);
export default r;
