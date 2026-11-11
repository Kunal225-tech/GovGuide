import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId || !mongoose.Types.ObjectId.isValid(req.userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid or missing user ID",
      });
      return;
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId || !mongoose.Types.ObjectId.isValid(req.userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid or missing user ID",
      });
      return;
    }

    const {
      age,
      gender,
      state,
      district,
      annualIncome,
      occupation,
      education,
      category,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        profile: {
          age: age !== undefined && age !== "" ? Number(age) : undefined,
          gender: typeof gender === "string" ? gender.trim() : undefined,
          state: typeof state === "string" ? state.trim() : undefined,
          district: typeof district === "string" ? district.trim() : undefined,
          annualIncome:
            annualIncome !== undefined && annualIncome !== ""
              ? Number(annualIncome)
              : undefined,
          occupation: typeof occupation === "string" ? occupation.trim() : undefined,
          education: typeof education === "string" ? education.trim() : undefined,
          category: typeof category === "string" ? category.trim() : undefined,
        },
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the updated fields
      }
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
