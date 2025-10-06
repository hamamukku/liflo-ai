import type { User } from '../models/user.js';
import { repos } from '../config/providers.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import argon2 from 'argon2';

function httpError(status: number, code?: string) {
  const e: any = new Error(code || '');
  e.status = status;
  e.code = code;
  return e;
}

async function createCustomToken(userId: string): Promise<string> {
  const mode = (process.env.AUTH_MODE || (env.NODE_ENV === 'production' ? 'firebase' : 'dev')).toLowerCase();

  if (mode === 'dev') {
    // devは“Bearer <userId>”で通す前提。customToken=ユーザーIDで返す。
    return userId;
  }

  if (mode === 'jwt') {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw httpError(500, 'jwt_secret_missing');
    const { default: jwt } = await import('jsonwebtoken');
    return jwt.sign({ sub: userId }, secret, { expiresIn: '30d' });
  }

  // firebase
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    if (getApps().length === 0) {
      const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
      if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) throw new Error('firebase_creds_missing');
      initializeApp({ credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }) });
    }
    return await getAuth().createCustomToken(userId);
  } catch (e) {
    logger.warn({ err: e }, 'createCustomToken failed; falling back to dev token');
    return userId;
  }
}

export async function login(nickname: string, pin: string): Promise<{ customToken: string; userId: string }> {
  const user = await repos.users.findByNickname(nickname);
  if (!user?.id || !user.pinHash) throw httpError(401, 'not_found'); // 候補・ヒント禁止

  const ok = await argon2.verify(user.pinHash, pin).catch(() => false);
  if (!ok) throw httpError(401, 'not_found');

  const customToken = await createCustomToken(user.id);
  return { customToken, userId: user.id };
}

export async function register(nickname: string, pin: string): Promise<{ userId: string }> {
  const existed = await repos.users.findByNickname(nickname);
  if (existed) throw httpError(400, 'bad_request');

  const pinHash = await argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: env.ARGON2_MEMORY,
    timeCost: env.ARGON2_ITERATIONS,
    parallelism: env.ARGON2_PARALLELISM,
  });

  const created: User = await repos.users.create({ nickname, pinHash });
  return { userId: created.id };
}
