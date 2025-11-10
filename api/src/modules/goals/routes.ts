import { Router } from "express";
import { GoalsController } from "./controller";

export const createGoalsRouter = (controller: GoalsController): Router => {
  const router = Router();

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.patch("/:id/status", controller.updateStatus);
  router.delete("/:id", controller.delete);

  return router;
};
