import { Request, Response } from "express";
import checkEligibility from "../services/eligibilityService";

export const getEligibleSchemes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required to evaluate scheme eligibility",
      });
      return;
    }

    const results = await checkEligibility(req.userId);

    res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    const isUserError = error instanceof Error && (error.message === "User not found" || error.message === "Invalid user ID");
    res.status(isUserError ? 400 : 500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to check scheme eligibility",
    });
  }
};