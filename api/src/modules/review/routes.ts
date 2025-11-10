import { Router } from "express";
import { ReviewController } from "./controller";

export const createReviewRouter = (controller: ReviewController): Router => {
  const router = Router();

  router.get("/", controller.list);
  router.get("/stats", controller.stats);

  return router;
};
