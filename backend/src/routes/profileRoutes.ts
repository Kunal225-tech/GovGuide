import { Router } from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/profileController";
import authMiddleware from "../middleware/authMiddleware";
import { validateProfileUpdate } from "../validators/profileValidator";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getProfile
);

router.put(
  "/",
  authMiddleware,
  validateProfileUpdate,
  updateProfile
);

export default router;
