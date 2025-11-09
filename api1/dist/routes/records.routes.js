import { Router } from 'express';
import * as records from '../controllers/records.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { recordCreateSchema } from '../schemas/record.schema.js';
const r = Router();
// POST /records  — CS=1..7、AI独立評価を生成して一括保存（service側）
r.post('/', validateBody(recordCreateSchema), records.create);
export default r;
