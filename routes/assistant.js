import { Router } from "express";
import { planPlaces } from "../controllers/assistant.controller.js";

const router = Router();
router.post("/route", planPlaces);

export default router;
