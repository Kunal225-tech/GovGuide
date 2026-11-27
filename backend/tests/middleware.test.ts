import express, { Request, Response } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import authMiddleware from "../src/middleware/authMiddleware";
import { createRateLimiter } from "../src/middleware/rateLimiter";
import { ENV } from "../src/config/env";

describe("Security Middleware (Auth & Rate Limiter)", () => {
  const buildProtectedApp = () => {
    const testApp = express();
    testApp.get("/protected", authMiddleware, (req: Request, res: Response) => {
      res.status(200).json({ userId: req.userId, userRole: req.userRole });
    });
    return testApp;
  };

  it("authMiddleware rejects missing Authorization header", async () => {
    const testApp = buildProtectedApp();
    const res = await request(testApp).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/authentication required/i);
  });

  it("authMiddleware rejects expired JWT tokens", async () => {
    const testApp = buildProtectedApp();
    const expiredToken = jwt.sign(
      { userId: "user-123", role: "user" },
      ENV.JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it("authMiddleware rejects tokens signed with wrong secret", async () => {
    const testApp = buildProtectedApp();
    const badToken = jwt.sign(
      { userId: "user-123", role: "user" },
      "completely-wrong-secret"
    );

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${badToken}`);

    expect(res.status).toBe(401);
  });

  it("authMiddleware attaches userId and userRole for valid token", async () => {
    const testApp = buildProtectedApp();
    const validToken = jwt.sign(
      { userId: "user-999", role: "admin" },
      ENV.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: "user-999", userRole: "admin" });
  });

  it("createRateLimiter allows requests under quota and returns 429 once exceeded", async () => {
    const testApp = express();
    const limiter = createRateLimiter(60_000, 3, "Rate limit hit");
    testApp.post("/limited", limiter, (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });

    for (let i = 0; i < 3; i++) {
      const okRes = await request(testApp).post("/limited");
      expect(okRes.status).toBe(200);
    }

    const blockedRes = await request(testApp).post("/limited");
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.message).toBe("Rate limit hit");
    expect(blockedRes.body.retryAfterSeconds).toBeGreaterThan(0);
  });
});
