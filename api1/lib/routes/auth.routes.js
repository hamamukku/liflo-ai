import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { authLoginSchema, authRegisterSchema } from '../schemas/auth.schema.js';
const r = Router();
// POST /auth/login  — 完全一致のみ成功、失敗は固定文（error.handler 側で統一）
r.post('/login', validateBody(authLoginSchema), auth.login);
// POST /auth/register（任意機能）
r.post('/register', validateBody(authRegisterSchema), auth.register);
export default r;
