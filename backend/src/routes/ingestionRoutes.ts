import { Router } from "express";
import { IngestionController } from "../controllers/ingestionController";
import authMiddleware from "../middleware/authMiddleware";
import adminMiddleware from "../middleware/adminMiddleware";

const router = Router();

// Strictly protected by Admin authorization
router.post(
  "/json",
  authMiddleware,
  adminMiddleware,
  IngestionController.ingestJson
);

router.post(
  "/csv",
  authMiddleware,
  adminMiddleware,
  IngestionController.ingestCsv
);

export default router;
