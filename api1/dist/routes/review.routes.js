import { Router } from 'express';
import * as review from '../controllers/review.controller.js';
import { validateQuery } from '../middlewares/validate.js';
import { reviewQuerySchema } from '../schemas/review.schema.js';
const r = Router();
// GET /review?from&to&goalId?
// 期間集計：count / avgUser / avgAI / states% / notes?
r.get('/', validateQuery(reviewQuerySchema), review.summary);
export default r;
