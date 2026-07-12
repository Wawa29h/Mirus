import { Router } from "express";
import {
  getFlowAtPoint,
  getTrafficStatus,
  getTrafficTile,
} from "../controllers/traffic.controller.js";

const router = Router();

router.get("/status", getTrafficStatus);
router.get("/flow", getFlowAtPoint);
router.get("/tiles/:z/:x/:y.png", getTrafficTile);

export default router;
