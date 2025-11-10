import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = Number(err?.status ?? err?.statusCode) || 500;
  const message = typeof err?.message === "string" ? err.message : "Internal server error";

  res.status(status).json({
    status: "error",
    message,
    data: null,
  });
};

export default errorHandler;
