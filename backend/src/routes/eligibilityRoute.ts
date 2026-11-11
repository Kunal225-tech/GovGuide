import { Router } from "express";
import { getEligibleSchemes } from "../controllers/eligibilityController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getEligibleSchemes
);

export default router;