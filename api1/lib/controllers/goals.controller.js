import { logSink } from "../config/providers.js";
import * as svc from "../services/goals.service.js";
import { sendSuccess } from "../utils/http.js";
function userIdFrom(req) {
    return req.user?.id ?? req.userId ?? "u1";
}
export async function listGoals(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const goals = await svc.getGoals(userId);
        await logSink.append({ endpoint: "/api/goals", method: "GET", userId, status: "success" });
        return sendSuccess(res, goals, "Goals fetched");
    }
    catch (error) {
        return next(error);
    }
}
export async function createGoal(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const goal = await svc.createGoal(userId, req.body ?? {});
        await logSink.append({ endpoint: "/api/goals", method: "POST", userId, status: "success" });
        return sendSuccess(res, goal, "Goal created", 201);
    }
    catch (error) {
        return next(error);
    }
}
export async function patchGoalStatus(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const { id } = req.params;
        const { status } = req.body ?? {};
        const goal = await svc.updateGoalStatus(userId, id, status);
        await logSink.append({ endpoint: `/api/goals/${id}/status`, method: "PATCH", userId, status: "success" });
        return sendSuccess(res, goal, "Goal status updated");
    }
    catch (error) {
        return next(error);
    }
}
export async function deleteGoal(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const { id } = req.params;
        await svc.removeGoal(userId, id);
        await logSink.append({ endpoint: `/api/goals/${id}`, method: "DELETE", userId, status: "success" });
        return sendSuccess(res, { id }, "Goal deleted");
    }
    catch (error) {
        return next(error);
    }
}
