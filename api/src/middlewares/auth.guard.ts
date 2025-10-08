// api/src/middlewares/auth.guard.ts
import type { Request, Response, NextFunction } from "express";
import { env, isProd } from "../config/env.js";
import { logger } from "../config/logger.js";

type AuthedRequest = Request & { user?: { id: string } };

function getAuthMode(): "firebase" | "jwt" | "dev" {
  const m = (env.AUTH_MODE || "").toLowerCase();
  if (m === "firebase" || m === "jwt" || m === "dev") return m;
  return isProd ? "firebase" : "dev";
}

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string } | null> {
  const { getAuth } = await import("firebase-admin/auth");
  const { initializeApp, getApps, cert } = await import("firebase-admin/app");

  if (getApps().length === 0) {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
    if (!(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY)) {
      logger.error("[auth] firebase admin credential missing");
      return null;
    }
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // GitHub / CI 用の改行エスケープを復元
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch (e: unknown) {
    logger.warn("[auth] verifyIdToken failed:", e as any);
    return null;
  }
}

export async function authGuard(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const mode = getAuthMode();

    // /auth は公開（app.ts 側で /auth を先に mount 済み）
    if (req.path.startsWith("/auth")) return next();

    const authz = req.headers.authorization || "";
    const m = authz.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1];

    if (mode === "dev") {
      // 開発・PoC用：任意の Bearer を userId として通す。無ければ u_demo。
      const uid = token || "u_demo";
      req.user = { id: uid };
      return next();
    }

    if (!token) return res.status(401).json({ error: "unauthorized" });

    if (mode === "firebase") {
      const verified = await verifyFirebaseIdToken(token);
      if (!verified) return res.status(401).json({ error: "unauthorized" });
      req.user = { id: verified.uid };
      return next();
    }

    if (mode === "jwt") {
      const { default: jwt } = await import("jsonwebtoken");
      const secret = env.JWT_SECRET;
      if (!secret) return res.status(500).json({ error: "server_misconfigured" });
      try {
        const payload = jwt.verify(token, secret) as any;
        const uid = payload.sub || payload.userId || payload.uid;
        if (!uid) return res.status(401).json({ error: "unauthorized" });
        req.user = { id: uid };
        return next();
      } catch (e: unknown) {
        logger.warn("[auth] jwt verify failed:", e as any);
        return res.status(401).json({ error: "unauthorized" });
      }
    }

    return res.status(401).json({ error: "unauthorized" });
  } catch (err: unknown) {
    // TS: unknown を any に落として next へ
    next(err as any);
  }
}
