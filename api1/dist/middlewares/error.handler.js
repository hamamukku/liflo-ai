import { logSink } from "../config/providers.js";
function getReqId(req) {
    return req.id ?? crypto.randomUUID?.() ?? String(Date.now());
}
function getClientMeta(req) {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        (req.socket && req.socket.remoteAddress) ||
        req.ip ||
        "";
    const ua = req.headers["user-agent"] || "";
    return { ip, ua };
}
function zodToDetails(err) {
    try {
        if (err?.name === "ZodError" && Array.isArray(err.issues)) {
            return err.issues.map((i) => ({
                path: Array.isArray(i.path) ? i.path.join(".") : String(i.path ?? ""),
                code: i.code,
                message: i.message,
            }));
        }
    }
    catch { }
    return undefined;
}
/**
 * 統一エラーハンドラ
 * - 既知: err.status（400/401/403/404/422 等）を尊重
 * - ZodError: 400 + { error: 'validation', details:[...] }
 * - それ以外: 500 + 固定レスポンス
 * - ロギング: HTTP_ERROR をサマリで Sheets/Console へ
 */
export const errorHandler = (err, req, res, _next) => {
    const started = req.__startedAt ?? undefined;
    const latency = typeof started === "number" ? Date.now() - started : undefined;
    const requestId = getReqId(req);
    const { ip, ua } = getClientMeta(req);
    const userId = req.user?.id || req.userId;
    // Zod バリデーション
    if (err?.name === "ZodError") {
        const body = { error: "validation", details: zodToDetails(err) };
        res.status(400).json(body);
        void logSink.append([
            {
                ts: new Date().toISOString(),
                requestId,
                userId,
                endpoint: req.path,
                method: req.method,
                event: "HTTP_ERROR",
                status: "fail",
                statusCode: 400,
                latencyMs: latency,
                ip,
                ua,
                note: "ZodError",
            },
        ]);
        return;
    }
    // 既知の HttpError 形式（status プロパティ）
    const status = Number(err?.status) || 500;
    // メッセージは固定化（内部情報の秘匿）
    let body;
    switch (status) {
        case 400:
            body = { error: "bad_request" };
            break;
        case 401:
            body = { error: "unauthorized" };
            break;
        case 403:
            body = { error: "forbidden" };
            break;
        case 404:
            body = { error: "not_found" };
            break;
        case 422:
            body = { error: "unprocessable_entity" };
            break;
        default:
            body = { error: "internal_error" };
            break;
    }
    res.status(status).json(body);
    // エラーを要約してログ（詳細本文・stackは記録しない）
    void logSink.append([
        {
            ts: new Date().toISOString(),
            requestId,
            userId,
            endpoint: req.path,
            method: req.method,
            event: "HTTP_ERROR",
            status: "fail",
            statusCode: status,
            latencyMs: latency,
            ip,
            ua,
            note: err?.name || "Error",
        },
    ]);
};
