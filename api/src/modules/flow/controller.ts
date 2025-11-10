import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/http";
import { FlowService } from "./service";

export class FlowController {
  constructor(private readonly service: FlowService) {}

  tips = (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = this.service.getTips();
      return sendSuccess(res, payload, "Flow tips retrieved.");
    } catch (error) {
      return next(error);
    }
  };
}
