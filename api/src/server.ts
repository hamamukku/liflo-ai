import dotenv from "dotenv";
import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.handler";
import { createRepositories, RepositoryKind } from "./repositories";
import { GoalsService } from "./modules/goals/service";
import { GoalsController } from "./modules/goals/controller";
import { createGoalsRouter } from "./modules/goals/routes";
import { RecordsService } from "./modules/records/service";
import { RecordsController } from "./modules/records/controller";
import { createRecordsRouter } from "./modules/records/routes";
import { ReviewService } from "./modules/review/service";
import { ReviewController } from "./modules/review/controller";
import { createReviewRouter } from "./modules/review/routes";
import { FlowService } from "./modules/flow/service";
import { FlowController } from "./modules/flow/controller";
import { createFlowRouter } from "./modules/flow/routes";
import { sendError } from "./utils/http";
import prisma from "./lib/prisma";
import { AuthService } from "./modules/auth/service";
import { AuthController } from "./modules/auth/controller";
import { createAuthRouter } from "./modules/auth/routes";
import { createAuthGuard } from "./middlewares/auth.guard";
import authRouter from "./routes/auth.routes";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const REPO = (process.env.REPO ?? "memory") as RepositoryKind;
const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-please";

const repositories = createRepositories(REPO);
const goalsService = new GoalsService(repositories.goals);
const goalsController = new GoalsController(goalsService);

const recordsService = new RecordsService(repositories.records);
const recordsController = new RecordsController(recordsService);

const reviewService = new ReviewService(repositories.records);
const reviewController = new ReviewController(reviewService);

const flowService = new FlowService();
const flowController = new FlowController(flowService);

const authService = new AuthService(prisma, JWT_SECRET);
const authController = new AuthController(authService);
const authGuard = createAuthGuard(authService);

const allowList = Array.from(
  new Set([
    FRONTEND_URL,
    "https://liflo-ai.web.app",
    "http://localhost:5173",
    "http://localhost:5174",
  ]),
).filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
// ---- Auth lightweight router (先頭でマウント) ----
app.use("/api/auth", authRouter);

const apiRouter = express.Router();
// ---- 既存のモジュールルータをコメントアウト ----
// apiRouter.use("/auth", createAuthRouter(authController, authGuard));
apiRouter.use("/goals", authGuard, createGoalsRouter(goalsController));
apiRouter.use("/records", authGuard, createRecordsRouter(recordsController));
apiRouter.use("/review", authGuard, createReviewRouter(reviewController));
apiRouter.use("/flow", authGuard, createFlowRouter(flowController));

app.use("/api", apiRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "success",
    message: "OK",
    data: { uptime: process.uptime() },
  });
});

app.use((_req, res) => {
  return sendError(res, "Resource not found.", 404, null);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
});
