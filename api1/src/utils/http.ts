import type { Response } from "express";

export type ApiStatus = "success" | "error";

export interface ApiResponse<T = unknown> {
  status: ApiStatus;
  message: string;
  data: T | null;
}

export function sendSuccess<T>(res: Response, data: T, message = "OK", statusCode = 200) {
  const body: ApiResponse<T> = {
    status: "success",
    message,
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, statusCode = 500, data: unknown = null) {
  const body: ApiResponse = {
    status: "error",
    message,
    data: data ?? null,
  };
  return res.status(statusCode).json(body);
}

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
