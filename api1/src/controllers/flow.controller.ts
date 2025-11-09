import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/http.js";
import { getFlowTips } from "../services/flow.service.js";

export async function getTips(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = getFlowTips();
    return sendSuccess(res, data, "Flow tips");
  } catch (error) {
    return next(error);
  }
}
