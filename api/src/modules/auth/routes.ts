import { Router, type RequestHandler } from "express";
import { AuthController } from "./controller";

export const createAuthRouter = (
  controller: AuthController,
  guard: RequestHandler,
): Router => {
  const router = Router();

  router.post("/signup", controller.signup);
  router.post("/login", controller.login);
  router.post("/logout", guard, controller.logout);
  router.get("/me", guard, controller.me);

  return router;
};
