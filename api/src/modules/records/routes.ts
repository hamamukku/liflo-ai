import { Router } from "express";
import { RecordsController } from "./controller";

export const createRecordsRouter = (controller: RecordsController): Router => {
  const router = Router();

  router.get("/", controller.list);
  router.post("/", controller.create);

  return router;
};
