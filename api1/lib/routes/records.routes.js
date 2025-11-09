import { Router } from "express";
import { createRecord, deleteRecord, getRecord, listRecords, } from "../controllers/records.controller.js";
const router = Router();
router.get("/", listRecords);
router.post("/", createRecord);
router.get("/:id", getRecord);
router.delete("/:id", deleteRecord);
export default router;
