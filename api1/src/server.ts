import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import lifloCors from "./middlewares/cors.js";
import { errorHandler } from "./middlewares/error.handler.js";
import { authGuard } from "./middlewares/auth.guard.js";

import authRouter from "./routes/auth.routes.js";
import goalsRouter from "./routes/goals.routes.js";
import recordsRouter from "./routes/records.routes.js";
import reviewRouter from "./routes/review.routes.js";
import flowRouter from "./routes/flow.routes.js";

dotenv.config();

const app = express();

app.use(lifloCors);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);

const apiRouter = express.Router();
apiRouter.use("/goals", authGuard, goalsRouter);
apiRouter.use("/records", authGuard, recordsRouter);
apiRouter.use("/review", authGuard, reviewRouter);
apiRouter.use("/flow", authGuard, flowRouter);

app.use("/api", apiRouter);

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

app.use(errorHandler);

export { app };
export default app;
