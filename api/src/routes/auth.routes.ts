import { Router } from "express";
import { signup, me } from "../services/auth.service";

const router = Router();

router.post("/signup", signup);
router.get("/me", me);

export default router;
