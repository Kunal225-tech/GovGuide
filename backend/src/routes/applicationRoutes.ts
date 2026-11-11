import { Router } from "express";
import {
  getUserApplications,
  updateApplication,
  createOrUpdateApplication,
  deleteApplication,
  getSavedSchemes,
  saveScheme,
  unsaveScheme,
} from "../controllers/applicationController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// Subroutes for backward-compatibility if anything calls /api/applications/saved
router.get("/saved", authMiddleware, getSavedSchemes);
router.post("/saved", authMiddleware, saveScheme);
router.post("/saved/:id", authMiddleware, saveScheme);
router.delete("/saved/:id", authMiddleware, unsaveScheme);

// Applications Tracker endpoints
router.get("/", authMiddleware, getUserApplications);
router.post("/", authMiddleware, createOrUpdateApplication);
router.put("/:id", authMiddleware, updateApplication);
router.patch("/:id", authMiddleware, updateApplication);
router.delete("/:id", authMiddleware, deleteApplication);

export default router;
