// src/server.ts
import { createServer } from 'node:http';         // ← 'http' より 'node:http' が堅い
import app from './app.js';                       // ← .js拡張子のままでOK（ESMの正解）
import { logger } from './config/logger.js';
import { env } from './config/env.js';

const port = Number(env.PORT ?? 8787);
const server = createServer(app);

server.listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, 'API server started');
});
