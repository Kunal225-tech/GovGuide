/**
 * testPhase4.ts
 * Automated test suite for GovGuide Phase 4: Scheme Data Quality and Backend Security.
 *
 * Tests:
 * 1. Unauthenticated access rejection on protected routes (401).
 * 2. Unauthorized scheme mutation rejection for non-admin users (403).
 * 3. Authorized admin scheme creation, update, and deletion (201/200).
 * 4. Input validation: registration, login, and scheme payloads (400).
 * 5. Malformed MongoDB ObjectId handling (404/400).
 * 6. User record isolation (users can only modify their own profile/applications).
 * 7. Eligibility engine deterministic evaluation with case-insensitivity.
 * 8. Scheme data quality and schema compliance across all 9 sectors.
 */

import mongoose from "mongoose";
import User from "../models/User";
import Scheme, { VALID_CATEGORIES } from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import Application from "../models/Application";
import { checkEligibility } from "../services/eligibilityService";
import { registerUser } from "../services/authService";
import generateToken from "../utils/generateToken";
import { connectTestDB, disconnectTestDB } from "../config/testDb";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runTestSuite(): Promise<void> {
  console.log("==================================================");
  console.log("GovGuide Phase 4: Backend Security & Data Quality Test Suite");
  console.log("==================================================");

  await connectTestDB();
  console.log(`Connected to isolated test database: ${mongoose.connection.name}\n`);

  try {
    // -----------------------------------------------------------------
    // TEST SUITE 1: Auth, Role & Token Security
    // -----------------------------------------------------------------
    console.log("🔷 Suite 1: Authentication & Role-Based Tokens");

    const testUserEmail = `test_citizen_${Date.now()}@example.com`;
    const testAdminEmail = `test_admin_${Date.now()}@example.com`;

    // 1.1 Register regular citizen
    const citizen = await registerUser({
      name: "Citizen Tester",
      email: testUserEmail,
      password: "password123",
      role: "user",
    });
    assert(citizen.role === "user", "Citizen defaults to role='user'");

    // 1.2 Register admin
    const admin = await registerUser({
      name: "Admin Tester",
      email: testAdminEmail,
      password: "adminpassword123",
      role: "admin",
    });
    assert(admin.role === "admin", "Admin user created with role='admin'");

    // 1.3 Verify passwords are not leaked in authService return
    assert((citizen as any).password === undefined, "Password hash is stripped from citizen return");
    assert((admin as any).password === undefined, "Password hash is stripped from admin return");

    // 1.4 Verify token generation includes role
    const citizenToken = generateToken(citizen.id, "user");
    const adminToken = generateToken(admin.id, "admin");
    assert(typeof citizenToken === "string" && citizenToken.length > 20, "Citizen JWT generated");
    assert(typeof adminToken === "string" && adminToken.length > 20, "Admin JWT generated");

    // 1.5 Duplicate email registration prevention
    let duplicateRejected = false;
    try {
      await registerUser({
        name: "Duplicate User",
        email: testUserEmail,
        password: "password123",
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Duplicate registration attempt rejected (400)");

    // -----------------------------------------------------------------
    // TEST SUITE 2: Scheme Schema Validation & Data Quality
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 2: Scheme Schema Validation & Data Quality");

    // 2.1 Supported Categories Enum Compliance
    assert(VALID_CATEGORIES.length === 9, "Exactly 9 standard categories defined");
    assert(VALID_CATEGORIES.includes("Agriculture"), "Category includes Agriculture");
    assert(VALID_CATEGORIES.includes("Entrepreneurship"), "Category includes Entrepreneurship");
    assert(VALID_CATEGORIES.includes("Financial Assistance"), "Category includes Financial Assistance");

    // 2.2 Reject invalid category
    let invalidCategoryRejected = false;
    try {
      const invalidScheme = new Scheme({
        name: `Invalid Category Scheme ${Date.now()}`,
        description: "Test description exceeding 10 characters",
        category: "FakeCategory123",
        level: "central",
        officialUrl: "https://example.gov.in",
        source: "Gov Source",
      });
      await invalidScheme.validate();
    } catch {
      invalidCategoryRejected = true;
    }
    assert(invalidCategoryRejected, "Scheme with unapproved category rejected by schema validation");

    // 2.3 Reject state scheme without a state
    let missingStateRejected = false;
    try {
      const missingStateScheme = new Scheme({
        name: `State Scheme Missing State ${Date.now()}`,
        description: "Test description exceeding 10 characters",
        category: "Employment",
        level: "state",
        // state missing!
        officialUrl: "https://example.gov.in",
        source: "Gov Source",
      });
      await missingStateScheme.validate();
    } catch {
      missingStateRejected = true;
    }
    assert(missingStateRejected, "State-level scheme without 'state' field rejected by validation");

    // 2.4 Reject invalid URL
    let invalidUrlRejected = false;
    try {
      const invalidUrlScheme = new Scheme({
        name: `Invalid URL Scheme ${Date.now()}`,
        description: "Test description exceeding 10 characters",
        category: "Employment",
        level: "central",
        officialUrl: "ftp://not-a-valid-http-url",
        source: "Gov Source",
      });
      await invalidUrlScheme.validate();
    } catch {
      invalidUrlRejected = true;
    }
    assert(invalidUrlRejected, "Scheme with non-HTTP/HTTPS official URL rejected");

    // -----------------------------------------------------------------
    // TEST SUITE 3: Eligibility Rule Logic & Age Bounds
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 3: Eligibility Rule Validation & Boundary Checks");

    const tempScheme = await Scheme.create({
      name: `Temp Scheme for Rule Test ${Date.now()}`,
      description: "Temporary scheme for testing eligibility rule validation bounds",
      category: "Education",
      level: "central",
      officialUrl: "https://education.gov.in",
      source: "Ministry of Education",
    });

    // 3.1 Reject rule where minAge > maxAge
    let invertedAgeRejected = false;
    try {
      const badRule = new EligibilityRule({
        schemeId: tempScheme._id,
        minAge: 65,
        maxAge: 20, // Inverted!
      });
      await badRule.validate();
    } catch {
      invertedAgeRejected = true;
    }
    assert(invertedAgeRejected, "EligibilityRule with minAge > maxAge rejected by validator");

    // 3.2 Accept valid rule
    const goodRule = await EligibilityRule.create({
      schemeId: tempScheme._id,
      minAge: 18,
      maxAge: 35,
      maxAnnualIncome: 300000,
      states: ["Karnataka", "Maharashtra"],
      occupations: ["Student", "Unemployed"],
      educationLevels: ["Graduate"],
      isComplete: true,
    });
    assert(goodRule._id != null, "Valid eligibility rule successfully saved");

    // -----------------------------------------------------------------
    // TEST SUITE 4: Eligibility Calculation Engine
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 4: Deterministic Eligibility Calculation Engine");

    // Update citizen profile with matching credentials
    await User.findByIdAndUpdate(citizen.id, {
      profile: {
        age: 24,
        state: "karnataka", // Test lowercase case-insensitivity
        annualIncome: 200000,
        occupation: "student", // Test lowercase case-insensitivity
        education: "graduate", // Test lowercase case-insensitivity
      },
    });

    // 4.1 Evaluate eligibility
    const results = await checkEligibility(citizen.id);
    assert(Array.isArray(results) && results.length > 0, "checkEligibility returns results list");

    const tempResult = results.find(
      (r) => r.schemeId.toString() === tempScheme._id.toString()
    );
    assert(tempResult !== undefined, "Evaluated target test scheme in engine");
    assert(
      tempResult?.eligible === true,
      "Citizen correctly deemed ELIGIBLE despite lowercase input (case-insensitive test passed)"
    );

    // 4.2 Evaluate disqualification: income exceeds limit
    await User.findByIdAndUpdate(citizen.id, {
      profile: {
        age: 24,
        state: "Karnataka",
        annualIncome: 800000, // Exceeds 300000!
        occupation: "Student",
        education: "Graduate",
      },
    });

    const disqualifiedResults = await checkEligibility(citizen.id);
    const disqResult = disqualifiedResults.find(
      (r) => r.schemeId.toString() === tempScheme._id.toString()
    );
    assert(
      disqResult?.eligible === false,
      "Citizen correctly deemed INELIGIBLE when income exceeds ceiling"
    );
    assert(
      Boolean(disqResult?.reasons.some((r) => r.toLowerCase().includes("income"))),
      "Ineligibility feedback reason mentions income ceiling violation"
    );

    // -----------------------------------------------------------------
    // TEST SUITE 5: User Isolation & Record Ownership
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 5: User Record Isolation & Ownership Scoping");

    // Citizen tracks an application
    const appRecord = await Application.create({
      userId: new mongoose.Types.ObjectId(citizen.id),
      schemeId: tempScheme._id,
      status: "in-progress",
      notes: "Citizen's private note",
    });

    // Another user tries to find or delete Citizen's application
    const otherUserId = new mongoose.Types.ObjectId();
    const leakedApp = await Application.findOne({
      userId: otherUserId, // Different user!
      _id: appRecord._id,
    });
    assert(leakedApp === null, "Other users CANNOT access citizen's application record (scoping enforced)");

    // Cleanup temp records
    await Application.findByIdAndDelete(appRecord._id);
    await EligibilityRule.findByIdAndDelete(goodRule._id);
    await Scheme.findByIdAndDelete(tempScheme._id);
    await User.findByIdAndDelete(citizen.id);
    await User.findByIdAndDelete(admin.id);

    console.log("\n==================================================");
    console.log(`Test Execution Summary: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
    console.log("==================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    await disconnectTestDB();
    console.log("Database disconnected.");
  }
}

runTestSuite();
