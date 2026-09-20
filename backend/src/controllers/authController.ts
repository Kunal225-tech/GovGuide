import { Request, Response } from "express";
import registerUser, { loginUser } from "../services/authService";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser({
      name,
      email,
      password,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Registration failed",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginUser({
      email,
      password,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Login failed",
    });
  }
};

