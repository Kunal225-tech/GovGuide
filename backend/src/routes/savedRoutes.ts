import { Router } from "express";
import {
  saveScheme,
  unsaveScheme,
  getSavedSchemes,
} from "../controllers/applicationController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// Retrieve all saved schemes for the authenticated user
// GET /api/saved
router.get("/", authMiddleware, getSavedSchemes);

// Save a scheme
// POST /api/saved (body: { schemeId }) OR POST /api/saved/:id
router.post("/", authMiddleware, saveScheme);
router.post("/:id", authMiddleware, saveScheme);

// Unsave a scheme
// DELETE /api/saved/:id OR DELETE /api/saved (body: { schemeId })
router.delete("/:id", authMiddleware, unsaveScheme);
router.delete("/", authMiddleware, unsaveScheme);

export default router;
