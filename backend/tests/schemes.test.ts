import mongoose from "mongoose";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import Scheme from "../src/models/Scheme";
import EligibilityRule from "../src/models/EligibilityRule";
import User from "../src/models/User";
import generateToken from "../src/utils/generateToken";

const sampleBiharScheme = {
  name: "Bihar Student Credit Card Scheme",
  description: "Interest-free/low-interest education loan up to 4 lakh for Bihar students.",
  category: "Education" as const,
  level: "state" as const,
  state: "Bihar",
  officialUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in/",
  source: "Education Department, Government of Bihar",
};

const sampleCentralScheme = {
  name: "PM-KISAN Samman Nidhi",
  description: "Income support of Rs 6000 per year for small and marginal farmer families.",
  category: "Agriculture" as const,
  level: "central" as const,
  officialUrl: "https://pmkisan.gov.in/",
  source: "Ministry of Agriculture & Farmers Welfare",
};

const otherStateScheme = {
  name: "Maharashtra State Scholarship Test",
  description: "State scheme only applicable to Maharashtra residents.",
  category: "Education" as const,
  level: "state" as const,
  state: "Maharashtra",
  officialUrl: "https://mahadbt.maharashtra.gov.in/",
  source: "Government of Maharashtra",
};

describe("Scheme API", () => {
  it("GET /api/schemes returns Bihar and Central schemes and excludes other state schemes", async () => {
    await Scheme.create([sampleBiharScheme, sampleCentralScheme, otherStateScheme] as any);

    const res = await request(app).get("/api/schemes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    const names = res.body.data.map((s: { name: string }) => s.name);
    expect(names).toContain(sampleBiharScheme.name);
    expect(names).toContain(sampleCentralScheme.name);
    expect(names).not.toContain(otherStateScheme.name);
  });

  it("GET /api/schemes/:id returns scheme details for a valid ID", async () => {
    const created = (await Scheme.create(sampleBiharScheme)) as any;

    const res = await request(app).get(`/api/schemes/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(sampleBiharScheme.name);
    expect(res.body.data.category).toBe("Education");
  });

  it("GET /api/schemes/:id returns 404 for nonexistent or malformed scheme ID", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const resMissing = await request(app).get(`/api/schemes/${missingId}`);
    expect(resMissing.status).toBe(404);
    expect(resMissing.body.success).toBe(false);

    const resMalformed = await request(app).get("/api/schemes/not-a-valid-id");
    expect(resMalformed.status).toBe(404);
    expect(resMalformed.body.success).toBe(false);
  });

  it("POST /api/schemes requires admin role and creates a scheme when authorized", async () => {
    const hashedPassword = await bcrypt.hash("AdminPass123!", 10);
    const regularUser = await User.create({
      name: "Regular User",
      email: "user@example.com",
      password: hashedPassword,
      role: "user",
    });
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });

    const userToken = generateToken(regularUser._id.toString(), "user");
    const adminToken = generateToken(adminUser._id.toString(), "admin");

    const unauthRes = await request(app).post("/api/schemes").send(sampleBiharScheme);
    expect(unauthRes.status).toBe(401);

    const forbiddenRes = await request(app)
      .post("/api/schemes")
      .set("Authorization", `Bearer ${userToken}`)
      .send(sampleBiharScheme);
    expect(forbiddenRes.status).toBe(403);

    const createdRes = await request(app)
      .post("/api/schemes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleBiharScheme);
    expect(createdRes.status).toBe(201);
    expect(createdRes.body.data.name).toBe(sampleBiharScheme.name);
  });

  it("PUT /api/schemes/:id updates an existing scheme for admin", async () => {
    const hashedPassword = await bcrypt.hash("AdminPass123!", 10);
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin2@example.com",
      password: hashedPassword,
      role: "admin",
    });
    const adminToken = generateToken(adminUser._id.toString(), "admin");
    const scheme = (await Scheme.create(sampleCentralScheme)) as any;

    const updateRes = await request(app)
      .put(`/api/schemes/${scheme._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "under-review" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe("under-review");
  });

  it("DELETE /api/schemes/:id removes scheme and cascades EligibilityRule deletion", async () => {
    const hashedPassword = await bcrypt.hash("AdminPass123!", 10);
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin3@example.com",
      password: hashedPassword,
      role: "admin",
    });
    const adminToken = generateToken(adminUser._id.toString(), "admin");
    const scheme = (await Scheme.create(sampleBiharScheme)) as any;
    await EligibilityRule.create({
      schemeId: scheme._id,
      minAge: 18,
      maxAge: 25,
      states: ["Bihar"],
      isComplete: true,
      isVerified: true,
    });

    const delRes = await request(app)
      .delete(`/api/schemes/${scheme._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(await Scheme.findById(scheme._id)).toBeNull();
    expect(await EligibilityRule.findOne({ schemeId: scheme._id })).toBeNull();
  });
});
