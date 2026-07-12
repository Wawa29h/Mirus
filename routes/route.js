import { Router } from "express";
import { calculateSmartRoute } from "../controllers/route.controller.js";
import { calculatePersonalizedRoutes, getDestinations } from "../controllers/smart-route.controller.js";

const router = Router();

router.get("/destinations", getDestinations);
router.post("/smart", calculatePersonalizedRoutes);
router.post("/calculate", calculateSmartRoute);

export default router;
