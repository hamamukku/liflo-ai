import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/http";
import { GoalsService } from "./service";
import { createGoalSchema, updateGoalStatusSchema } from "./dtos";

export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goals = await this.service.list(req.user!.id);
      return sendSuccess(res, goals, "Goals retrieved.");
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createGoalSchema.parse(req.body);
      const goal = await this.service.create(req.user!.id, parsed.title);
      return sendSuccess(res, goal, "Goal created.", 201);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateGoalStatusSchema.parse(req.body);
      const goal = await this.service.updateStatus(req.user!.id, id, parsed.status);
      return sendSuccess(res, goal, "Goal updated.");
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(req.user!.id, id);
      return sendSuccess(res, { ok: true }, "Goal deleted.");
    } catch (error) {
      return next(error);
    }
  };
}
