import { Response } from "express";

export type ResponseStatus = "success" | "error";

export type ApiResponse<T> = {
  status: ResponseStatus;
  message: string;
  data: T;
};

export class AppError extends Error {
  public statusCode: number;

  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "OK",
  statusCode = 200,
): Response => {
  const payload: ApiResponse<T> = {
    status: "success",
    message,
    data,
  };
  return res.status(statusCode).json(payload);
};

export const sendError = <T>(
  res: Response,
  message: string,
  statusCode: number,
  data: T,
): Response => {
  const payload: ApiResponse<T> = {
    status: "error",
    message,
    data,
  };
  return res.status(statusCode).json(payload);
};
