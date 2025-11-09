// src/repositories/postgres/prisma.client.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger.js';
import fs from 'node:fs';
import path from 'node:path';
/**
 * SQLite の "file:./xxx/dev.db" のときに、親ディレクトリが無いと
 * "Error code 14: Unable to open the database file" になる。
 * 起動前に必要ディレクトリを mkdir しておく。
 */
function ensureSqliteDir(dbUrl) {
    if (!dbUrl)
        return;
    if (!dbUrl.startsWith('file:'))
        return;
    // "file:" を外して生のパスを取る（"./prisma/dev.db" 等）
    const raw = dbUrl.slice('file:'.length);
    // 相対パスを絶対化して親ディレクトリを ensure
    const absPath = path.resolve(process.cwd(), raw);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
ensureSqliteDir(process.env.DATABASE_URL);
// ここから fail-fast 方針：接続に失敗したら throw で起動を止める。
// （providers.ts 側の try/catch が握ってくれる or プロセスを落として起動ミスを可視化できる）
export const prisma = new PrismaClient();
try {
    await prisma.$connect();
    // ここに来たら確実に接続済み
    // ※ logger は providers.ts と重複しても可。起動診断のため残す。
    logger.info('Prisma connected');
}
catch (err) {
    logger.error({ err }, 'Prisma initialization failed');
    // ★ 重要：throw して dynamic import を失敗させる → providers.ts が fallback 可能
    throw err;
}
