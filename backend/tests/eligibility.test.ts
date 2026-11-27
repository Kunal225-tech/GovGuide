import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import User from "../src/models/User";
import Scheme from "../src/models/Scheme";
import EligibilityRule from "../src/models/EligibilityRule";
import generateToken from "../src/utils/generateToken";

describe("Eligibility Engine API", () => {
  const createUserWithProfile = async (profile: Record<string, unknown>) => {
    const password = await bcrypt.hash("Password123!", 10);
    const user = await User.create({
      name: "Bihar Citizen",
      email: `citizen_${Date.now()}_${Math.random()}@example.com`,
      password,
      role: "user",
      profile,
    });
    const token = generateToken(user._id.toString(), "user");
    return { user, token };
  };

  it("GET /api/eligibility requires authentication", async () => {
    const res = await request(app).get("/api/eligibility");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("marks user eligible when all verified complete rule criteria match", async () => {
    const { token } = await createUserWithProfile({
      age: 20,
      gender: "Female",
      state: "Bihar",
      annualIncome: 150000,
      occupation: "Student",
      education: "12th Pass",
      category: "OBC",
    });

    const scheme = await Scheme.create({
      name: "Bihar Higher Education Support",
      description: "Financial support for students in Bihar who passed 12th.",
      category: "Education",
      level: "state",
      state: "Bihar",
      officialUrl: "https://bihar.gov.in/edu",
      source: "Education Department Bihar",
      hasDeterministicRule: true,
    });

    await EligibilityRule.create({
      schemeId: scheme._id,
      minAge: 17,
      maxAge: 25,
      maxAnnualIncome: 300000,
      states: ["Bihar"],
      occupations: ["Student"],
      educationLevels: ["12th Pass", "Undergraduate"],
      isVerified: true,
      isComplete: true,
    });

    const res = await request(app)
      .get("/api/eligibility")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.results[0].status).toBe("eligible");
    expect(res.body.results[0].eligible).toBe(true);
  });

  it("marks user ineligible when age or income exceeds rule ceilings", async () => {
    const { token } = await createUserWithProfile({
      age: 35,
      gender: "Male",
      state: "Bihar",
      annualIncome: 600000,
      occupation: "Student",
    });

    const scheme = await Scheme.create({
      name: "Youth Entrepreneurship Grant",
      description: "Youth grant for low-income citizens aged 18 to 30.",
      category: "Entrepreneurship",
      level: "state",
      state: "Bihar",
      officialUrl: "https://bihar.gov.in/youth",
      source: "Industries Department Bihar",
      hasDeterministicRule: true,
    });

    await EligibilityRule.create({
      schemeId: scheme._id,
      minAge: 18,
      maxAge: 30,
      maxAnnualIncome: 250000,
      states: ["Bihar"],
      isVerified: true,
      isComplete: true,
    });

    const res = await request(app)
      .get("/api/eligibility")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const result = res.body.results[0];
    expect(result.status).toBe("ineligible");
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r: string) => /exceeds the maximum eligible age/i.test(r))).toBe(true);
    expect(result.reasons.some((r: string) => /exceeds the upper ceiling/i.test(r))).toBe(true);
  });

  it("marks scheme unverified and lists missingProfileFields when profile lacks required data", async () => {
    const { token } = await createUserWithProfile({
      state: "Bihar",
    });

    const scheme = await Scheme.create({
      name: "Mahila Rozgar Scheme",
      description: "Financial grant for women entrepreneurs in Bihar.",
      category: "Women & Child",
      level: "state",
      state: "Bihar",
      officialUrl: "https://bihar.gov.in/women",
      source: "WCD Bihar",
      hasDeterministicRule: true,
    });

    await EligibilityRule.create({
      schemeId: scheme._id,
      minAge: 18,
      maxAge: 50,
      genders: ["Female"],
      isVerified: true,
      isComplete: true,
    });

    const res = await request(app)
      .get("/api/eligibility")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const result = res.body.results[0];
    expect(result.status).toBe("unverified");
    expect(result.eligible).toBe(false);
    expect(result.missingProfileFields).toEqual(expect.arrayContaining(["gender", "age"]));
  });

  it("handles discontinued schemes as ineligible and missing rules as unverified", async () => {
    const { token } = await createUserWithProfile({
      age: 24,
      state: "Bihar",
    });

    await Scheme.create({
      name: "Old Discontinued Scheme",
      description: "A scheme that has been discontinued by the government.",
      category: "Social Welfare",
      level: "central",
      officialUrl: "https://india.gov.in/old",
      source: "Ministry of Social Justice",
      status: "discontinued",
    });

    await Scheme.create({
      name: "Unverified Ruleless Scheme",
      description: "A scheme without a structured automated rule yet.",
      category: "Social Welfare",
      level: "central",
      officialUrl: "https://india.gov.in/unverified",
      source: "Ministry of Social Justice",
    });

    const res = await request(app)
      .get("/api/eligibility")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const byName = new Map<string, any>(
      res.body.results.map((r: any) => [r.schemeName, r])
    );

    expect(byName.get("Old Discontinued Scheme")?.status).toBe("ineligible");
    expect(byName.get("Unverified Ruleless Scheme")?.status).toBe("unverified");
  });
});
