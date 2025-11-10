import { Router } from "express";
import { FlowController } from "./controller";

export const createFlowRouter = (controller: FlowController): Router => {
  const router = Router();

  router.get("/tips", controller.tips);

  return router;
};
