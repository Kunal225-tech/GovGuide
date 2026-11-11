import { Router } from "express";
import { SchemeController } from "../controllers/schemeController";
import authMiddleware from "../middleware/authMiddleware";
import adminMiddleware from "../middleware/adminMiddleware";
import {
  validateScheme,
  validateSchemeUpdate,
} from "../validators/schemeValidator";

const router = Router();

// Scheme discovery routes (Protected by authMiddleware)
router.get("/", authMiddleware, SchemeController.getAllSchemes);
router.get("/:id", authMiddleware, SchemeController.getSchemeById);

// Admin-only management routes
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateScheme,
  SchemeController.createScheme
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateSchemeUpdate,
  SchemeController.updateScheme
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  SchemeController.deleteScheme
);

export default router;
