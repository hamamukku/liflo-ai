import { Router } from "express";
import { createGoal, deleteGoal, listGoals, patchGoalStatus, } from "../controllers/goals.controller.js";
const router = Router();
router.get("/", listGoals);
router.post("/", createGoal);
router.patch("/:id/status", patchGoalStatus);
router.delete("/:id", deleteGoal);
export default router;
