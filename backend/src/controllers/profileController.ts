import { Request , Response } from 'express';
import User from '../models/User';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            message: 'User profile fetched successfully',
            user,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile' });
    }
};
export const updateProfile = async (
  req: Request,
  res: Response
) => {
  try {
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
          age,
          gender,
          state,
          district,
          annualIncome,
          occupation,
          education,
          category,
        },
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the updated fields
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};
