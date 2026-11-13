import { Request, Response, NextFunction } from "express";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      success: false,
      message: "Request body is required.",
      errors: ["Request body is required."],
    });
    return;
  }

  const { name, email, password } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters long.");
  } else if (name.trim().length > 100) {
    errors.push("Name must not exceed 100 characters.");
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  } else if (password.length > 128) {
    errors.push("Password must not exceed 128 characters.");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
    return;
  }

  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      success: false,
      message: "Request body is required.",
      errors: ["Request body is required."],
    });
    return;
  }

  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
    return;
  }

  next();
};
