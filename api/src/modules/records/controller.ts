import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/http";
import { RecordsService } from "./service";
import { createRecordSchema } from "./dtos";

export class RecordsController {
  constructor(private readonly service: RecordsService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await this.service.list(req.user!.id);
      return sendSuccess(res, records, "Records retrieved.");
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createRecordSchema.parse(req.body);
      const record = await this.service.create(req.user!.id, parsed.text);
      return sendSuccess(res, record, "Record created.", 201);
    } catch (error) {
      return next(error);
    }
  };
}
