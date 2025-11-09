function getEnv(key) {
    try {
        // 環境に env モジュールがあれば優先
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const envMod = require("../config/env.js");
        if (envMod?.env && envMod.env[key] != null)
            return envMod.env[key];
    }
    catch { }
    return process.env[key];
}
function isProd() {
    const v = getEnv("NODE_ENV") || process.env.NODE_ENV;
    return String(v).toLowerCase() === "production";
}
function getAuthMode() {
    const m = (getEnv("AUTH_MODE") || "").toLowerCase();
    if (m === "firebase" || m === "jwt" || m === "dev")
        return m;
    return isProd() ? "firebase" : "dev";
}
async function verifyFirebaseIdToken(idToken) {
    const { getAuth } = await import("firebase-admin/auth");
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    if (getApps().length === 0) {
        const FIREBASE_PROJECT_ID = getEnv("FIREBASE_PROJECT_ID");
        const FIREBASE_CLIENT_EMAIL = getEnv("FIREBASE_CLIENT_EMAIL");
        const FIREBASE_PRIVATE_KEY = getEnv("FIREBASE_PRIVATE_KEY");
        if (!(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY)) {
            console.error("[auth] firebase admin credential missing");
            return null;
        }
        initializeApp({
            credential: cert({
                projectId: FIREBASE_PROJECT_ID,
                clientEmail: FIREBASE_CLIENT_EMAIL,
                privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
        });
    }
    try {
        const decoded = await getAuth().verifyIdToken(idToken);
        return { uid: decoded.uid };
    }
    catch (e) {
        console.warn("[auth] verifyIdToken failed:", e?.message || e);
        return null;
    }
}
export async function authGuard(req, res, next) {
    try {
        if (req.path.startsWith("/auth"))
            return next();
        const mode = getAuthMode();
        const authz = req.headers.authorization || "";
        const m = authz.match(/^Bearer\s+(.+)$/i);
        const token = m?.[1];
        if (mode === "dev") {
            // dev: userId 安定化（u1 既定 / ct_* は強制マップ / AUTH_DEV_FORCE_UID で上書き可）
            const forced = getEnv("AUTH_DEV_FORCE_UID");
            const fallbackUid = String(forced || "u1");
            let uid = fallbackUid;
            if (token && token.trim().length > 0) {
                if (/^ct_/i.test(token)) {
                    console.info("[auth:dev] map ct_* token ->", fallbackUid);
                    uid = fallbackUid;
                }
                else {
                    uid = token;
                }
            }
            req.user = { id: uid };
            return next();
        }
        if (!token)
            return res.status(401).json({ error: "unauthorized" });
        if (mode === "firebase") {
            const verified = await verifyFirebaseIdToken(token);
            if (!verified)
                return res.status(401).json({ error: "unauthorized" });
            req.user = { id: verified.uid };
            return next();
        }
        if (mode === "jwt") {
            const { default: jwt } = await import("jsonwebtoken");
            const secret = getEnv("JWT_SECRET");
            if (!secret)
                return res.status(500).json({ error: "server_misconfigured" });
            try {
                const payload = jwt.verify(token, secret);
                const uid = payload.sub || payload.userId || payload.uid;
                if (!uid)
                    return res.status(401).json({ error: "unauthorized" });
                req.user = { id: uid };
                return next();
            }
            catch (e) {
                console.warn("[auth] jwt verify failed:", e?.message || e);
                return res.status(401).json({ error: "unauthorized" });
            }
        }
    }
    catch (e) {
        console.error("[auth] internal_error:", e?.message || e);
        return res.status(500).json({ error: "internal_error" });
    }
}
