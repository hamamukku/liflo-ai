import { logSink } from "../config/providers.js";
import { HttpError, sendError } from "../utils/http.js";
function defaultMessage(status) {
    switch (status) {
        case 400:
            return "Bad request";
        case 401:
            return "Unauthorized";
        case 403:
            return "Forbidden";
        case 404:
            return "Not found";
        default:
            return "Internal server error";
    }
}
export const errorHandler = (err, req, res, _next) => {
    const status = err instanceof HttpError ? err.statusCode : Number(err?.status) || 500;
    const message = err instanceof HttpError ? err.message : defaultMessage(status);
    const details = err instanceof HttpError ? err.details ?? null : err?.details ?? null;
    sendError(res, message, status, details);
    void logSink.append({
        endpoint: req.originalUrl,
        method: req.method,
        status: "error",
        statusCode: status,
        message,
    });
};
export default errorHandler;
