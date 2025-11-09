import { Router } from "express";
import { getReview, getStats } from "../controllers/review.controller.js";
const router = Router();
router.get("/", getReview);
router.get("/stats", getStats);
export default router;
