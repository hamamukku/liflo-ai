import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'liflo-api', env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  // 秘匿：Bearerやpin類、鍵は出さない
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'body.pin',
      'body.pinHash',
      'FIREBASE_PRIVATE_KEY',
    ],
    remove: true,
  },
});
