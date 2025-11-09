import { logSink } from "../config/providers.js";
import * as svc from "../services/review.service.js";
import { sendSuccess } from "../utils/http.js";
function userIdFrom(req) {
    return req.user?.id ?? req.userId ?? "u1";
}
export async function getReview(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const data = await svc.getReviewFeed(userId);
        return sendSuccess(res, data, "Review feed loaded");
    }
    catch (error) {
        return next(error);
    }
}
export async function getStats(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const stats = await svc.getReviewStats(userId);
        await logSink.append({ endpoint: "/api/review/stats", method: "GET", userId, status: "success" });
        return sendSuccess(res, stats, "Review stats loaded");
    }
    catch (error) {
        return next(error);
    }
}
