import { env, isProd } from '../config/env.js';
import { logger } from '../config/logger.js';
async function verifyFirebaseIdToken(idToken) {
    try {
        const { getAuth } = await import('firebase-admin/auth');
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        if (getApps().length === 0) {
            const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
            if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
                initializeApp({ credential: cert({
                        projectId: FIREBASE_PROJECT_ID,
                        clientEmail: FIREBASE_CLIENT_EMAIL,
                        privateKey: FIREBASE_PRIVATE_KEY,
                    }) });
            }
            else {
                logger.warn('Firebase credentials missing; fallback will be used.');
                return null;
            }
        }
        const decoded = await getAuth().verifyIdToken(idToken);
        return { uid: decoded.uid };
    }
    catch (e) {
        logger.debug({ err: e }, 'Firebase ID token verification failed');
        return null;
    }
}
/**
 * Authorization: Bearer <token>
 * - dev: tokenを userId として通す（PoC接続検証の既定。例: "u_demo"）。
 * - firebase: Firebase ID Token を検証して uid を userId に採用。
 * - jwt: JWT_SECRET で検証して sub/userId/uid を採用。
 */
export async function authGuard(req, res, next) {
    try {
        const raw = req.headers.authorization;
        if (!raw?.startsWith('Bearer '))
            return res.status(401).json({ error: 'unauthorized' });
        const token = raw.slice('Bearer '.length).trim();
        const mode = (process.env.AUTH_MODE || (isProd ? 'firebase' : 'dev')).toLowerCase();
        if (mode === 'dev') {
            // FE↔BE接続検証手順の開発トークン方針（例: Bearer u_demo）。:contentReference[oaicite:8]{index=8}
            req.user = { id: token };
            return next();
        }
        if (mode === 'firebase') {
            const ok = await verifyFirebaseIdToken(token);
            if (!ok)
                return res.status(401).json({ error: 'unauthorized' });
            req.user = { id: ok.uid };
            return next();
        }
        if (mode === 'jwt') {
            const secret = process.env.JWT_SECRET;
            if (!secret)
                return res.status(500).json({ error: 'internal_error' });
            const { default: jwt } = await import('jsonwebtoken');
            try {
                const payload = jwt.verify(token, secret);
                const uid = payload.sub || payload.userId || payload.uid;
                if (!uid)
                    return res.status(401).json({ error: 'unauthorized' });
                req.user = { id: uid };
                return next();
            }
            catch {
                return res.status(401).json({ error: 'unauthorized' });
            }
        }
        return res.status(401).json({ error: 'unauthorized' });
    }
    catch (err) {
        next(err);
    }
}
