import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Quick check from token payload if role is already "admin"
    if (req.userRole === "admin") {
      next();
      return;
    }

    // Fallback: Verify current role in database
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied: Administrator privileges required",
      });
      return;
    }

    req.userRole = "admin";
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authorization check failed",
    });
    return;
  }
};

export default adminMiddleware;
