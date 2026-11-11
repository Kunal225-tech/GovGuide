import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Creates an in-memory rate limiter middleware.
 * @param windowMs Time window in milliseconds (e.g. 15 * 60 * 1000 for 15 mins)
 * @param maxRequests Maximum allowed requests in the time window
 * @param message Custom error message on rate limit exceeded
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 100,
  message: string = "Too many requests. Please try again later."
) => {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired keys periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();

    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    record.count += 1;

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

// Default rate limiter for authentication routes: max 30 requests per 15 mins
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  30,
  "Too many authentication attempts from this IP. Please try again in 15 minutes."
);
