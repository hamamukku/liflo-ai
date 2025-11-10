import { ErrorRequestHandler } from "express";
import { AppError, sendError } from "../utils/http";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (!(err instanceof AppError)) {
    console.error(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : "Unexpected error occurred.";
  const details = err instanceof AppError ? err.details ?? null : null;

  return sendError(res, message, statusCode, details);
};
