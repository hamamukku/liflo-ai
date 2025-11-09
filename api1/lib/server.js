// api/src/server.ts
import express from "express";
import lifloCors from "./middlewares/cors.js";
import { nodeEnv, authMode, dbProvider } from "./config/env.js";
import { errorHandler } from "./middlewares/error.handler.js";
/**
 * Non-blocking logger bootstrap:
 * - start with console fallback so synchronous startup never waits
 * - attempt a dynamic import, but don't await it (won't block initialization)
 */
let info = console.info.bind(console);
let warn = console.warn.bind(console);
try {
    // Kick off async import but don't await it (non-blocking)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import("firebase-functions/logger")
        .then((mod) => {
        if (mod?.info)
            info = mod.info.bind(mod);
        if (mod?.warn)
            warn = mod.warn.bind(mod);
        // optional: log that specialized logger was loaded
        info("logger module loaded");
    })
        .catch(() => {
        // keep console fallback
    });
}
catch {
    // ignore; keep console fallback
}
/** ルータ解決（default / named(router) / それ以外はスタブ） */
function asRouter(mod, label) {
    const cand = mod?.default ?? mod?.router ?? mod;
    if (cand && (typeof cand === "object" || typeof cand === "function") && typeof cand.use === "function") {
        return cand;
    }
    warn(`Router ${label} not valid; using stub`);
    const r = express.Router();
    r.get("/", (_req, res) => res.status(501).json({ message: `${label} router not implemented` }));
    return r;
}
/** ミドルウェア解決（関数のみ許可） */
function asMiddleware(mod, name) {
    const cand = mod?.default ?? mod?.[name] ?? mod;
    return typeof cand === "function" ? cand : null;
}
/** Import routes/middlewares (should NOT perform heavy startup work at module top-level) */
import * as authMod from "./routes/auth.routes.js";
import * as goalsMod from "./routes/goals.routes.js";
import * as recordsMod from "./routes/records.routes.js";
import * as reviewMod from "./routes/review.routes.js";
import * as flowMod from "./routes/flow.routes.js";
import * as guardMod from "./middlewares/auth.guard.js";
const authRouter = asRouter(authMod, "auth");
const goalsRouter = asRouter(goalsMod, "goals");
const recordsRouter = asRouter(recordsMod, "records");
const reviewRouter = asRouter(reviewMod, "review");
const flowRouter = asRouter(flowMod, "flow");
const authGuard = asMiddleware(guardMod, "authGuard");
const app = express();
/** Important: CORS must be first middleware to avoid preflight being handled wrongly */
app.use(lifloCors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/** Safe startup log (non-blocking) */
try {
    info("BOOT", { nodeEnv, authMode, dbProvider });
}
catch {
    console.info("BOOT", { nodeEnv, authMode, dbProvider });
}
/** Routing mount */
const API_BASE = "/api";
app.use(`${API_BASE}/auth`, authRouter);
if (authGuard) {
    app.use(`${API_BASE}/goals`, authGuard, goalsRouter);
    app.use(`${API_BASE}/records`, authGuard, recordsRouter);
    app.use(`${API_BASE}/review`, authGuard, reviewRouter);
    app.use(`${API_BASE}/flow`, authGuard, flowRouter);
}
else {
    app.use(`${API_BASE}/goals`, goalsRouter);
    app.use(`${API_BASE}/records`, recordsRouter);
    app.use(`${API_BASE}/review`, reviewRouter);
    app.use(`${API_BASE}/flow`, flowRouter);
}
/** Health check */
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
/** Minimal error handler so initialization doesn't crash on first thrown */
app.use(errorHandler);
/**
 * IMPORTANT:
 * Do NOT call app.listen() here. Cloud Functions / Functions emulator will
 * mount the exported app handler. Starting a server at import time causes
 * the deploy-time analyzer to hang or the emulator to conflict.
 */
export { app };
export default app;
