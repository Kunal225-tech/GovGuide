import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validateRegister, validateLogin } from "../validators/authValidator";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, validateRegister, register);
router.post("/login", authRateLimiter, validateLogin, login);

export default router;