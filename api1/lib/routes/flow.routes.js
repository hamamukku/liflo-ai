import { Router } from "express";
import { getTips } from "../controllers/flow.controller.js";
const router = Router();
router.get("/tips", getTips);
export default router;
