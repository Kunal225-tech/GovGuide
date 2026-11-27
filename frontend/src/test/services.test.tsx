import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { mockSchemes, mockUser, mockEligibilityResults } from "./mocks/handlers";
import { getSchemes, getSchemeById, NotFoundError } from "@/services/schemeApi";
import { getProfile, updateProfile, AuthError } from "@/services/profileApi";
import { getEligibility } from "@/services/eligibilityApi";

describe("Frontend API Services", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("schemeApi.getSchemes fetches and returns scheme list", async () => {
    const schemes = await getSchemes();
    expect(schemes).toHaveLength(mockSchemes.length);
    expect(schemes[0].name).toBe("Bihar Student Credit Card Scheme");
  });

  it("schemeApi.getSchemes throws on server 500 error", async () => {
    server.use(
      http.get("/api/schemes", () => {
        return HttpResponse.json({ success: false }, { status: 500 });
      })
    );

    await expect(getSchemes()).rejects.toThrow(/Failed to fetch schemes: 500/i);
  });

  it("schemeApi.getSchemeById returns scheme and throws NotFoundError on 404", async () => {
    const scheme = await getSchemeById("scheme-bsccs-1");
    expect(scheme._id).toBe("scheme-bsccs-1");
    expect(scheme.category).toBe("Education");

    await expect(getSchemeById("missing-id")).rejects.toThrow(NotFoundError);
  });

  it("profileApi.getProfile throws AuthError when token is missing or 401", async () => {
    await expect(getProfile()).rejects.toThrow(AuthError);

    localStorage.setItem("token", "expired-token");
    server.use(
      http.get("/api/profile", () => {
        return HttpResponse.json({ success: false }, { status: 401 });
      })
    );
    await expect(getProfile()).rejects.toThrow(/Session expired/i);
  });

  it("profileApi.getProfile and updateProfile succeed with valid token", async () => {
    localStorage.setItem("token", "valid-jwt-token");

    const user = await getProfile();
    expect(user.email).toBe(mockUser.email);

    const updated = await updateProfile({ district: "Gaya", age: 23 });
    expect(updated.profile.district).toBe("Gaya");
    expect(updated.profile.age).toBe(23);
  });

  it("eligibilityApi.getEligibility throws AuthError without token and returns results when authenticated", async () => {
    await expect(getEligibility()).rejects.toThrow(AuthError);

    localStorage.setItem("token", "valid-jwt-token");
    const results = await getEligibility();
    expect(results).toHaveLength(mockEligibilityResults.length);
    expect(results[0].status).toBe("eligible");
    expect(results[1].status).toBe("ineligible");
  });
});
