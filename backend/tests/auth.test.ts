import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";
import User from "../src/models/User";
import generateToken from "../src/utils/generateToken";
import { ENV } from "../src/config/env";

describe("Auth API & Token Utilities", () => {
  it("POST /api/auth/register creates a new user and returns a valid JWT", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ravi Kumar",
      email: "ravi.kumar@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("ravi.kumar@example.com");
    expect(res.body.user.password).toBeUndefined();

    const saved = await User.findOne({ email: "ravi.kumar@example.com" });
    expect(saved).not.toBeNull();
    expect(saved?.password).not.toBe("Password123!");
  });

  it("POST /api/auth/register rejects duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "First User",
      email: "dup@example.com",
      password: "Password123!",
    });

    const dupRes = await request(app).post("/api/auth/register").send({
      name: "Second User",
      email: "DUP@example.com",
      password: "Password123!",
    });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toMatch(/already exists/i);
  });

  it("POST /api/auth/register validates email and password strength", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "A",
      email: "invalid-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("POST /api/auth/login authenticates valid user and returns verifiable JWT", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Priya Singh",
      email: "priya@example.com",
      password: "StrongPass99",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "priya@example.com",
      password: "StrongPass99",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();

    const decoded = jwt.verify(loginRes.body.token, ENV.JWT_SECRET) as {
      userId: string;
      role: string;
    };
    expect(decoded.userId).toBe(loginRes.body.user.id);
    expect(decoded.role).toBe("user");
  });

  it("POST /api/auth/login rejects wrong password or unknown email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test Citizen",
      email: "citizen@example.com",
      password: "CorrectPassword1",
    });

    const wrongPassRes = await request(app).post("/api/auth/login").send({
      email: "citizen@example.com",
      password: "WrongPassword1",
    });
    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.body.success).toBe(false);

    const unknownUserRes = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "CorrectPassword1",
    });
    expect(unknownUserRes.status).toBe(401);
    expect(unknownUserRes.body.success).toBe(false);
  });

  it("generateToken embeds userId and role claims into JWT", () => {
    const token = generateToken("650000000000000000000001", "admin");
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      role: string;
    };
    expect(decoded.userId).toBe("650000000000000000000001");
    expect(decoded.role).toBe("admin");
  });
});
