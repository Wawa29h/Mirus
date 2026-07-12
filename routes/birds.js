import { Router } from "express";
import { getBirds } from "../controllers/birds.controller.js";
import { getForecast } from "../controllers/forecast.controller.js";

const router = Router();
router.get("/", getBirds);
router.get("/forecast", getForecast); // pronóstico de aves migratorias (eBird + LLM)
export default router;
