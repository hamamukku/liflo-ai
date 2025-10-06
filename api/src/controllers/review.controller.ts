import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/review.service.js';

type Authed = Request & { user?: { id: string } };

export async function summary(req: Authed, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const { from, to, goalId } = req.query as Partial<{ from: string; to: string; goalId: string }>;
    const data = await svc.summary(userId, { from: from!, to: to!, goalId });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
