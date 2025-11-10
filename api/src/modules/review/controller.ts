import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/http";
import { ReviewService } from "./service";

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await this.service.list(req.user!.id);
      return sendSuccess(res, records, "Review entries retrieved.");
    } catch (error) {
      return next(error);
    }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats(req.user!.id);
      return sendSuccess(res, stats, "Review stats retrieved.");
    } catch (error) {
      return next(error);
    }
  };
}
