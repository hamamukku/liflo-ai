import { logSink } from "../config/providers.js";
/**
 * GET /goals
 * ユーザーの目標一覧を取得
 */
export async function list(req, res, next) {
    try {
        // ダミー: 本来はサービス層から取得
        const goals = [
            { id: "g1", userId: "u1", content: "サンプル目標1" },
            { id: "g2", userId: "u1", content: "サンプル目標2" },
        ];
        res.json(goals);
    }
    catch (err) {
        next(err);
    }
}
/**
 * POST /goals
 * 新しい目標を作成
 */
export async function create(req, res, next) {
    try {
        const { content } = req.body;
        if (!content) {
            const err = new Error("bad_request");
            err.status = 400;
            throw err;
        }
        const newGoal = {
            id: `g-${Date.now()}`,
            userId: req.userId ?? "u1",
            content,
        };
        res.status(201).json(newGoal);
        void logSink.append([
            {
                ts: new Date().toISOString(),
                userId: newGoal.userId,
                endpoint: "/goals",
                method: "POST",
                event: "GOAL_CREATED",
                status: "success",
            },
        ]);
    }
    catch (err) {
        next(err);
    }
}
/**
 * PUT /goals/:id
 * 目標を更新
 */
export async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!id || !content) {
            const err = new Error("bad_request");
            err.status = 400;
            throw err;
        }
        const updated = {
            id,
            userId: req.userId ?? "u1",
            content,
            updatedAt: new Date().toISOString(),
        };
        res.json(updated);
        void logSink.append([
            {
                ts: new Date().toISOString(),
                userId: updated.userId,
                endpoint: `/goals/${id}`,
                method: "PUT",
                event: "GOAL_UPDATED",
                status: "success",
            },
        ]);
    }
    catch (err) {
        next(err);
    }
}
