import { Router } from "express";
import { describePlace, planPlaces } from "../controllers/assistant.controller.js";

const router = Router();
router.post("/route", planPlaces);
router.post("/place-info", describePlace);

export default router;
