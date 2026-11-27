import { http, HttpResponse } from "msw";
import type { Scheme } from "@/types/scheme";
import type { User } from "@/types/user";
import type { EligibilityResult } from "@/types/eligibility";

export const mockSchemes: Scheme[] = [
  {
    _id: "scheme-bsccs-1",
    name: "Bihar Student Credit Card Scheme",
    description: "Provides education loans up to Rs 4 lakh for students in Bihar under 7-Nischay.",
    category: "Education",
    level: "state",
    state: "Bihar",
    benefits: ["Education loan up to Rs 4 lakh"],
    eligibility: ["Resident of Bihar", "12th Pass"],
    requiredDocuments: ["Aadhaar Card", "12th Marksheet"],
    applicationProcess: ["Apply online on 7 Nischay portal"],
    officialUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in/",
    source: "Education Department, Bihar",
  },
  {
    _id: "scheme-pmkisan-2",
    name: "PM-KISAN Samman Nidhi",
    description: "Income support of Rs 6,000 per year for eligible farmer families.",
    category: "Agriculture",
    level: "central",
    benefits: ["Rs 6,000 per year in 3 installments"],
    eligibility: ["Small and marginal farmers"],
    requiredDocuments: ["Aadhaar Card", "Land Records"],
    applicationProcess: ["Register on PM-KISAN portal"],
    officialUrl: "https://pmkisan.gov.in/",
    source: "Ministry of Agriculture",
  },
  {
    _id: "scheme-kanya-3",
    name: "Mukhyamantri Kanya Utthan Yojana",
    description: "Financial incentive for girls in Bihar from birth up to graduation.",
    category: "Women & Child",
    level: "state",
    state: "Bihar",
    benefits: ["Up to Rs 54,100 cumulative benefit"],
    eligibility: ["Resident of Bihar", "Female"],
    requiredDocuments: ["Aadhaar Card", "Marksheet"],
    applicationProcess: ["Apply on Medhasoft"],
    officialUrl: "https://medhasoft.bih.nic.in/",
    source: "Social Welfare Department, Bihar",
  },
];

export const mockUser: User = {
  _id: "user-123",
  name: "Ravi Kumar",
  email: "ravi@example.com",
  role: "user",
  profile: {
    age: 21,
    gender: "Male",
    state: "Bihar",
    district: "Patna",
    annualIncome: 150000,
    occupation: "Student",
    education: "12th Pass",
    category: "OBC",
  },
};

export const mockEligibilityResults: EligibilityResult[] = [
  {
    schemeId: "scheme-bsccs-1",
    schemeName: "Bihar Student Credit Card Scheme",
    status: "eligible",
    eligible: true,
    reasons: ["All automated eligibility criteria have been verified and satisfied."],
  },
  {
    schemeId: "scheme-kanya-3",
    schemeName: "Mukhyamantri Kanya Utthan Yojana",
    status: "ineligible",
    eligible: false,
    reasons: ["Gender criteria not met. Scheme is designated for: Female (your profile: Male)"],
  },
  {
    schemeId: "scheme-pmkisan-2",
    schemeName: "PM-KISAN Samman Nidhi",
    status: "unverified",
    eligible: false,
    reasons: ["Additional landholding verification required on official portal."],
  },
];

export const handlers = [
  http.get("/api/schemes", () => {
    return HttpResponse.json({
      success: true,
      count: mockSchemes.length,
      data: mockSchemes,
    });
  }),

  http.get("/api/schemes/:id", ({ params }) => {
    const scheme = mockSchemes.find((s) => s._id === params.id);
    if (!scheme) {
      return HttpResponse.json(
        { success: false, message: "Scheme not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: scheme,
    });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === "ravi@example.com" && body.password === "Password123!") {
      return HttpResponse.json({
        success: true,
        message: "Login successful",
        token: "header.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0.signature",
        user: mockUser,
      });
    }
    return HttpResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 }
    );
  }),

  http.get("/api/profile", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      success: true,
      message: "User profile fetched successfully",
      user: mockUser,
    });
  }),

  http.put("/api/profile", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const payload = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...mockUser,
        profile: { ...mockUser.profile, ...payload },
      },
    });
  }),

  http.get("/api/eligibility", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      success: true,
      count: mockEligibilityResults.length,
      results: mockEligibilityResults,
    });
  }),

  http.get("/api/saved", () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  http.post("/api/saved", async ({ request }) => {
    const body = (await request.json()) as { schemeId?: string };
    return HttpResponse.json(
      { success: true, data: { _id: "saved-1", schemeId: body.schemeId } },
      { status: 201 }
    );
  }),

  http.delete("/api/saved/:id", () => {
    return HttpResponse.json({ success: true });
  }),
];
