import * as svc from '../services/review.service.js';
export async function summary(req, res, next) {
    try {
        const userId = req.user?.id;
        const { from, to, goalId } = req.query;
        const data = await svc.summary(userId, { from: from, to: to, goalId });
        res.status(200).json(data);
    }
    catch (err) {
        next(err);
    }
}
