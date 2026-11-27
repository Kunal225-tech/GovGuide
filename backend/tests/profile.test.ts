import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import User from "../src/models/User";
import generateToken from "../src/utils/generateToken";

describe("Profile API", () => {
  const createCitizen = async () => {
    const password = await bcrypt.hash("Password123!", 10);
    const user = await User.create({
      name: "Anjali Devi",
      email: "anjali@example.com",
      password,
      role: "user",
      profile: {
        age: 28,
        state: "Bihar",
        district: "Patna",
      },
    });
    const token = generateToken(user._id.toString(), "user");
    return { user, token };
  };

  it("GET /api/profile rejects unauthenticated access", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/profile returns authenticated user's profile without password", async () => {
    const { token } = await createCitizen();

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("anjali@example.com");
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.profile.district).toBe("Patna");
  });

  it("PUT /api/profile updates demographic fields and persists changes", async () => {
    const { user, token } = await createCitizen();

    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        age: 29,
        gender: "Female",
        state: "Bihar",
        district: "Muzaffarpur",
        annualIncome: 120000,
        occupation: "Self Employed",
        education: "Graduate",
        category: "EBC",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.profile.district).toBe("Muzaffarpur");
    expect(res.body.user.profile.annualIncome).toBe(120000);
    expect(res.body.user.profile.category).toBe("EBC");

    const updatedInDb = await User.findById(user._id);
    expect(updatedInDb?.profile.occupation).toBe("Self Employed");
  });

  it("PUT /api/profile validates age range and non-negative income", async () => {
    const { token } = await createCitizen();

    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        age: 150,
        annualIncome: -5000,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBe(2);
  });
});
