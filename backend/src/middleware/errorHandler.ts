import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log server errors for internal debugging
  if (!ENV.IS_PRODUCTION) {
    console.error("Unhandled Error:", err);
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map(
      (e: any) => e.message || "Validation failed"
    );
    res.status(400).json({
      success: false,
      message: messages[0] || "Invalid request payload",
      errors: messages,
    });
    return;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
    });
    return;
  }

  // Handle Mongo Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
    return;
  }

  // Handle Malformed JSON body parser error
  if (err.type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body",
    });
    return;
  }

  // Generic Internal Server Error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      ENV.IS_PRODUCTION && statusCode === 500
        ? "An internal server error occurred"
        : err.message || "Internal server error",
  });
};
