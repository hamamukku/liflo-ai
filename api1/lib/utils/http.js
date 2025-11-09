export function sendSuccess(res, data, message = "OK", statusCode = 200) {
    const body = {
        status: "success",
        message,
        data,
    };
    return res.status(statusCode).json(body);
}
export function sendError(res, message, statusCode = 500, data = null) {
    const body = {
        status: "error",
        message,
        data: data ?? null,
    };
    return res.status(statusCode).json(body);
}
export class HttpError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
