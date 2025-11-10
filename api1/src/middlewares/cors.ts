import type { RequestHandler } from "express";

const allowList = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://liflo-ai.web.app",
]);

export const lifloCors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !allowList.has(origin)) {
    return res.status(403).json({ status: "error", message: "CORS blocked", data: null });
  }

  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization,Accept,Content-Type,Origin,X-Requested-With,If-None-Match,If-Match",
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return next();
};

export default lifloCors;
