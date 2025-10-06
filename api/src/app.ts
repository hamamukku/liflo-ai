import express from 'express';
import { buildCors } from './middlewares/cors.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { authGuard } from './middlewares/auth.guard.js';
import { errorHandler } from './middlewares/error.handler.js';
import { logger } from './config/logger.js';

// ルータ（ESM/NodeNext: .js 拡張子）
import authRoutes from './routes/auth.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import recordsRoutes from './routes/records.routes.js';
import reviewRoutes from './routes/review.routes.js';

const app = express();

// プロキシ/ヘッダ
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 先頭ミドル
app.use(buildCors());
app.use(rateLimit());
app.use(express.json());

// ヘルスチェック
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// /auth はガード不要（login/register）
app.use('/auth', authRoutes);

// 以降は認可が必須
app.use(authGuard);
app.use('/goals', goalsRoutes);
app.use('/records', recordsRoutes);
app.use('/review', reviewRoutes);

// 統一エラーハンドラ（固定エラーポリシー）
app.use(errorHandler);

// 起動確認ログ（テスト時は静かに）
if (process.env.NODE_ENV !== 'test') {
  logger.info('App initialized');
}

export default app;
