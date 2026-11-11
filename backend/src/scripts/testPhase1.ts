/**
 * testPhase1.ts
 * Comprehensive Test Suite for GovGuide Phase 1: Schema Hardening & Eligibility Safety.
 *
 * Verifies:
 * 1. Backward compatibility for legacy schemes with no new fields.
 * 2. Central, State, UT, and Centrally Sponsored classifications (schemeType).
 * 3. Multiple applicable states (applicableStates).
 * 4. EligibilityRule gender criteria validation (valid & invalid).
 * 5. Safety Gate: Missing eligibility rules NEVER produce eligible: true.
 * 6. Safety Gate: Incomplete/unverified rules (hasDeterministicRule=false, isVerified=false).
 * 7. Safety Gate: Discontinued schemes are marked ineligible.
 * 8. Gender evaluation: Female qualifies, Male rejected, missing gender rejected.
 * 9. Multi-state residency matching and missing profile handling.
 * 10. Saved scheme and Application foreign-key integrity.
 * 11. Schema validator middleware backward compatibility and rejection of invalid enums.
 */

import mongoose from "mongoose";
import User from "../models/User";
import Scheme from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import Application from "../models/Application";
import { checkEligibility } from "../services/eligibilityService";
import { validateScheme } from "../validators/schemeValidator";
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

async function runPhase1Tests(): Promise<void> {
  console.log("==================================================");
  console.log("GovGuide Phase 1: Schema Hardening & Eligibility Safety Test Suite");
  console.log("==================================================");

  await connectTestDB();
  console.log(`Connected to isolated test database: ${mongoose.connection.name}\n`);

  const createdSchemeIds: mongoose.Types.ObjectId[] = [];
  const createdRuleIds: mongoose.Types.ObjectId[] = [];
  const createdUserIds: mongoose.Types.ObjectId[] = [];
  const createdAppIds: mongoose.Types.ObjectId[] = [];

  try {
    // -----------------------------------------------------------------
    // SUITE 1: Backward Compatibility (Legacy Schemes without New Fields)
    // -----------------------------------------------------------------
    console.log("🔷 Suite 1: Backward Compatibility for Legacy Schemes");

    const legacyScheme = await Scheme.create({
      name: `Legacy Central Scheme ${Date.now()}`,
      description: "Scheme created using only legacy fields without any Phase 1 additions",
      category: "Agriculture",
      level: "central",
      officialUrl: "https://agricoop.gov.in",
      source: "Ministry of Agriculture",
    });
    createdSchemeIds.push(legacyScheme._id as mongoose.Types.ObjectId);

    assert(legacyScheme._id != null, "Legacy scheme saved without optional fields");
    assert(legacyScheme.verificationStatus === "unverified", "Default verificationStatus is 'unverified'");
    assert(legacyScheme.status === "active", "Default status is 'active'");
    assert(Array.isArray(legacyScheme.applicableStates) && legacyScheme.applicableStates.length === 0, "Default applicableStates is empty array");
    assert(legacyScheme.hasDeterministicRule === undefined, "hasDeterministicRule remains undefined when omitted");

    // Legacy state-level scheme
    const legacyStateScheme = await Scheme.create({
      name: `Legacy State Scheme ${Date.now()}`,
      description: "State scheme created using only legacy fields",
      category: "Healthcare",
      level: "state",
      state: "Punjab",
      officialUrl: "https://health.punjab.gov.in",
      source: "Government of Punjab",
    });
    createdSchemeIds.push(legacyStateScheme._id as mongoose.Types.ObjectId);

    assert(legacyStateScheme.state === "Punjab", "Legacy state scheme preserves state field");
    assert(
      Array.isArray(legacyStateScheme.applicableStates) &&
        legacyStateScheme.applicableStates.includes("Punjab"),
      "Pre-validate hook automatically synced applicableStates from state"
    );

    // -----------------------------------------------------------------
    // SUITE 2: All-India Classifications & Multi-State Support
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 2: All-India Classifications (Central, State, UT, CSS)");

    // 2.1 Central Sector
    const centralSectorScheme = await Scheme.create({
      name: `Test Central Sector Scheme ${Date.now()}`,
      description: "100% centrally funded welfare program",
      category: "Education",
      level: "central",
      schemeType: "central-sector",
      hasDeterministicRule: true,
      verificationStatus: "verified",
      officialUrl: "https://education.gov.in",
      source: "Ministry of Education",
    });
    createdSchemeIds.push(centralSectorScheme._id as mongoose.Types.ObjectId);
    assert(centralSectorScheme.schemeType === "central-sector", "Scheme created with schemeType='central-sector'");

    // 2.2 Centrally Sponsored Scheme with multiple applicable states
    const cssScheme = await Scheme.create({
      name: `Test Centrally Sponsored Scheme ${Date.now()}`,
      description: "Cost-sharing scheme for North-Eastern and Hill states",
      category: "Housing",
      level: "central",
      schemeType: "centrally-sponsored",
      applicableStates: ["Assam", "Meghalaya", "Himachal Pradesh", "Uttarakhand"],
      hasDeterministicRule: true,
      verificationStatus: "verified",
      officialUrl: "https://rural.gov.in",
      source: "Ministry of Rural Development",
    });
    createdSchemeIds.push(cssScheme._id as mongoose.Types.ObjectId);
    assert(cssScheme.schemeType === "centrally-sponsored", "Scheme created with schemeType='centrally-sponsored'");
    assert(cssScheme.applicableStates?.length === 4, "Scheme supports multiple applicableStates (4 states)");

    // 2.3 Union Territory Scheme
    const utScheme = await Scheme.create({
      name: `Test Delhi UT Scheme ${Date.now()}`,
      description: "Welfare scheme designated for Union Territory of Delhi",
      category: "Social Welfare",
      level: "state",
      state: "Delhi",
      schemeType: "ut",
      applicableStates: ["Delhi"],
      hasDeterministicRule: true,
      verificationStatus: "verified",
      officialUrl: "https://delhi.gov.in",
      source: "Government of NCT of Delhi",
    });
    createdSchemeIds.push(utScheme._id as mongoose.Types.ObjectId);
    assert(utScheme.schemeType === "ut", "Scheme created with schemeType='ut'");

    // 2.4 Reject invalid schemeType
    let invalidSchemeTypeRejected = false;
    try {
      const badScheme = new Scheme({
        name: `Bad SchemeType ${Date.now()}`,
        description: "Test description exceeding 10 characters",
        category: "Employment",
        level: "central",
        schemeType: "invalid-type-123",
        officialUrl: "https://example.gov.in",
        source: "Source",
      });
      await badScheme.validate();
    } catch {
      invalidSchemeTypeRejected = true;
    }
    assert(invalidSchemeTypeRejected, "Scheme rejects unsupported schemeType enum");

    // 2.5 Reject invalid verificationStatus
    let invalidVerificationRejected = false;
    try {
      const badScheme = new Scheme({
        name: `Bad Verification ${Date.now()}`,
        description: "Test description exceeding 10 characters",
        category: "Employment",
        level: "central",
        verificationStatus: "random-status",
        officialUrl: "https://example.gov.in",
        source: "Source",
      });
      await badScheme.validate();
    } catch {
      invalidVerificationRejected = true;
    }
    assert(invalidVerificationRejected, "Scheme rejects unsupported verificationStatus enum");

    // -----------------------------------------------------------------
    // SUITE 3: EligibilityRule Gender Criteria Validation
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 3: EligibilityRule Gender Criteria Validation");

    const femaleOnlyRule = await EligibilityRule.create({
      schemeId: centralSectorScheme._id,
      genders: ["Female"],
      minAge: 18,
      maxAge: 45,
      isVerified: true,
      isComplete: true,
    });
    createdRuleIds.push(femaleOnlyRule._id as mongoose.Types.ObjectId);
    assert(Boolean(femaleOnlyRule.genders?.includes("Female")), "EligibilityRule supports valid gender restriction ('Female')");

    // Multi-gender rule
    const multiGenderRule = new EligibilityRule({
      schemeId: cssScheme._id,
      genders: ["Male", "Female", "Transgender"],
    });
    await multiGenderRule.validate();
    assert(multiGenderRule.genders?.length === 3, "EligibilityRule accepts multiple valid genders");

    // Reject unsupported gender
    let invalidGenderRejected = false;
    try {
      const badGenderRule = new EligibilityRule({
        schemeId: utScheme._id,
        genders: ["Alien"],
      });
      await badGenderRule.validate();
    } catch {
      invalidGenderRejected = true;
    }
    assert(invalidGenderRejected, "EligibilityRule rejects unsupported gender value ('Alien')");

    // -----------------------------------------------------------------
    // SUITE 4: Eligibility Safety Gates (No False Positives)
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 4: Eligibility Safety Gates");

    // Create a citizen user
    const testCitizen = await User.create({
      name: "Phase 1 Citizen",
      email: `citizen_p1_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 25,
        gender: "Female",
        state: "Assam",
        annualIncome: 150000,
        occupation: "Student",
        education: "Graduate",
        category: "General",
      },
    });
    createdUserIds.push(testCitizen._id as mongoose.Types.ObjectId);

    // 4.1 Scheme with NO EligibilityRule in DB
    const unruledScheme = await Scheme.create({
      name: `Unruled Scheme Safety Test ${Date.now()}`,
      description: "Scheme without an EligibilityRule record in database",
      category: "Financial Assistance",
      level: "central",
      officialUrl: "https://finmin.nic.in",
      source: "Ministry of Finance",
    });
    createdSchemeIds.push(unruledScheme._id as mongoose.Types.ObjectId);

    const initialResults = await checkEligibility(testCitizen.id);
    const unruledResult = initialResults.find(
      (r) => r.schemeId.toString() === unruledScheme._id.toString()
    );

    assert(unruledResult !== undefined, "Unruled scheme evaluated in checkEligibility");
    assert(
      unruledResult?.eligible === false,
      "SAFETY GATE 1: Scheme without EligibilityRule is marked INELIGIBLE (false positive prevented)"
    );
    assert(
      Boolean(unruledResult?.reasons.some((r) => r.includes("not been verified"))),
      "Safety feedback clearly explains criteria has not been verified"
    );

    // 4.2 Scheme with hasDeterministicRule = false
    const pendingReviewScheme = await Scheme.create({
      name: `Pending Review Scheme ${Date.now()}`,
      description: "Scheme whose rules are explicitly unverified or pending review",
      category: "Healthcare",
      level: "central",
      hasDeterministicRule: false,
      verificationStatus: "needs-review",
      officialUrl: "https://mohfw.gov.in",
      source: "MoHFW",
    });
    createdSchemeIds.push(pendingReviewScheme._id as mongoose.Types.ObjectId);

    // Even if an incomplete rule doc exists:
    const pendingRule = await EligibilityRule.create({
      schemeId: pendingReviewScheme._id,
      minAge: 18,
      isVerified: false,
    });
    createdRuleIds.push(pendingRule._id as mongoose.Types.ObjectId);

    const pendingResults = await checkEligibility(testCitizen.id);
    const pendingEval = pendingResults.find(
      (r) => r.schemeId.toString() === pendingReviewScheme._id.toString()
    );
    assert(
      pendingEval?.eligible === false,
      "SAFETY GATE 2: Scheme with hasDeterministicRule=false or isVerified=false marked INELIGIBLE"
    );
    assert(
      Boolean(pendingEval?.reasons.some((r) => r.includes("pending"))),
      "Safety feedback states rules are pending verification"
    );

    // 4.3 Discontinued scheme
    const discontinuedScheme = await Scheme.create({
      name: `Discontinued Welfare Scheme ${Date.now()}`,
      description: "Former scheme that has been formally discontinued",
      category: "Social Welfare",
      level: "central",
      status: "discontinued",
      officialUrl: "https://socialjustice.gov.in",
      source: "Department of Social Justice",
    });
    createdSchemeIds.push(discontinuedScheme._id as mongoose.Types.ObjectId);

    const discResults = await checkEligibility(testCitizen.id);
    const discEval = discResults.find(
      (r) => r.schemeId.toString() === discontinuedScheme._id.toString()
    );
    assert(discEval?.eligible === false, "SAFETY GATE 3: Discontinued scheme marked INELIGIBLE");
    assert(
      Boolean(discEval?.reasons.some((r) => r.includes("discontinued"))),
      "Feedback states scheme has been discontinued"
    );

    // -----------------------------------------------------------------
    // SUITE 5: Gender-Restricted Scheme Evaluation
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 5: Gender-Restricted Scheme Evaluation & Profile Integrity");

    // Female Citizen evaluates against femaleOnlyRule (created on centralSectorScheme in Suite 3)
    const femaleEval = initialResults.find(
      (r) => r.schemeId.toString() === centralSectorScheme._id.toString()
    );
    assert(femaleEval?.eligible === true, "Female citizen ELIGIBLE for female-restricted scheme");

    // Create Male Citizen
    const maleCitizen = await User.create({
      name: "Male Citizen Tester",
      email: `male_citizen_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 25,
        gender: "Male", // MALE!
        state: "Assam",
        annualIncome: 150000,
      },
    });
    createdUserIds.push(maleCitizen._id as mongoose.Types.ObjectId);

    const maleResults = await checkEligibility(maleCitizen.id);
    const maleEval = maleResults.find(
      (r) => r.schemeId.toString() === centralSectorScheme._id.toString()
    );
    assert(maleEval?.eligible === false, "Male citizen INELIGIBLE for female-restricted scheme");
    assert(
      Boolean(maleEval?.reasons.some((r) => r.includes("Gender") && r.includes("Female"))),
      "Reason clearly identifies gender requirement mismatch"
    );

    // Create Citizen with missing gender in profile
    const anonymousCitizen = await User.create({
      name: "Anonymous Citizen Tester",
      email: `anon_citizen_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 25,
        // gender missing!
        state: "Assam",
        annualIncome: 150000,
      },
    });
    createdUserIds.push(anonymousCitizen._id as mongoose.Types.ObjectId);

    const anonResults = await checkEligibility(anonymousCitizen.id);
    const anonEval = anonResults.find(
      (r) => r.schemeId.toString() === centralSectorScheme._id.toString()
    );
    assert(anonEval?.eligible === false, "Citizen with missing gender INELIGIBLE for gender-restricted scheme");
    assert(
      Boolean(anonEval?.reasons.some((r) => r.includes("gender is not specified"))),
      "Reason indicates profile is missing required gender"
    );

    // -----------------------------------------------------------------
    // SUITE 6: Multi-State & UT Applicability Evaluation
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 6: Multi-State and UT Residency Matching");

    // cssScheme has applicableStates: ["Assam", "Meghalaya", "Himachal Pradesh", "Uttarakhand"]
    // Add rule for cssScheme with maxIncome 500000
    const cssRule = await EligibilityRule.create({
      schemeId: cssScheme._id,
      maxAnnualIncome: 500000,
      isVerified: true,
      isComplete: true,
    });
    createdRuleIds.push(cssRule._id as mongoose.Types.ObjectId);

    // testCitizen is in Assam (one of the 4 applicable states)
    const assamResults = await checkEligibility(testCitizen.id);
    const assamEval = assamResults.find(
      (r) => r.schemeId.toString() === cssScheme._id.toString()
    );
    assert(assamEval?.eligible === true, "Assam citizen ELIGIBLE for multi-state CSS scheme covering Assam");

    // Update citizen state to Maharashtra (not in applicableStates)
    await User.findByIdAndUpdate(testCitizen.id, {
      "profile.state": "Maharashtra",
    });
    const mhResults = await checkEligibility(testCitizen.id);
    const mhEval = mhResults.find(
      (r) => r.schemeId.toString() === cssScheme._id.toString()
    );
    assert(mhEval?.eligible === false, "Maharashtra citizen INELIGIBLE for CSS scheme not covering Maharashtra");
    assert(
      Boolean(mhEval?.reasons.some((r) => r.includes("restricted to residents of"))),
      "Reason details applicable state restrictions"
    );

    // -----------------------------------------------------------------
    // SUITE 7: Saved Schemes & Application Foreign-Key Integrity
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 7: Saved Schemes & Application Foreign-Key Integrity");

    const appBookmark = await Application.create({
      userId: testCitizen._id,
      schemeId: cssScheme._id,
      status: "saved",
      notes: "Phase 1 bookmark integrity check",
    });
    createdAppIds.push(appBookmark._id as mongoose.Types.ObjectId);

    // Simulate scheme update (modifying scheme fields without dropping document)
    await Scheme.findByIdAndUpdate(cssScheme._id, {
      description: "Updated description to test foreign-key permanence",
      verifiedAt: new Date(),
    });

    const populatedApp = await Application.findById(appBookmark._id).populate("schemeId");
    assert(populatedApp != null, "Application record still exists after scheme update");
    assert(
      (populatedApp?.schemeId as any).name === cssScheme.name,
      "Populated scheme matches original scheme name (foreign-key intact)"
    );

    // -----------------------------------------------------------------
    // SUITE 8: Validator Middleware Compatibility
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 8: Validator Middleware Compliance");

    let mockStatus = 200;
    let nextCalled = false;

    const mockRes = {
      status: (code: number) => {
        mockStatus = code;
        return {
          json: () => {},
        };
      },
    } as any;

    const mockNext = () => {
      nextCalled = true;
    };

    // 8.1 Valid legacy request passes validator
    nextCalled = false;
    validateScheme(
      {
        body: {
          name: "Valid Legacy API Scheme",
          description: "Description exceeding minimum ten characters",
          category: "Agriculture",
          level: "central",
          officialUrl: "https://valid.gov.in",
          source: "Ministry of Agriculture",
        },
      } as any,
      mockRes,
      mockNext
    );
    assert(nextCalled, "validateScheme permits valid legacy request without new fields");

    // 8.2 Valid request with new Phase 1 fields passes validator
    nextCalled = false;
    validateScheme(
      {
        body: {
          name: "Valid Phase 1 API Scheme",
          description: "Description exceeding minimum ten characters",
          category: "Employment",
          level: "state",
          state: "Karnataka",
          schemeType: "state",
          applicableStates: ["Karnataka"],
          applicationUrl: "https://sevasindhu.karnataka.gov.in/apply",
          verificationStatus: "verified",
          status: "active",
          hasDeterministicRule: true,
          officialUrl: "https://karnataka.gov.in",
          source: "Gov of Karnataka",
        },
      } as any,
      mockRes,
      mockNext
    );
    assert(nextCalled, "validateScheme permits valid request with full Phase 1 fields");

    // 8.3 Invalid applicationUrl rejected (400)
    nextCalled = false;
    mockStatus = 200;
    validateScheme(
      {
        body: {
          name: "Invalid App URL Scheme",
          description: "Description exceeding minimum ten characters",
          category: "Healthcare",
          level: "central",
          officialUrl: "https://valid.gov.in",
          source: "Gov Source",
          applicationUrl: "ftp://invalid-protocol",
        },
      } as any,
      mockRes,
      mockNext
    );
    assert(mockStatus === 400 && !nextCalled, "validateScheme rejects non-HTTP applicationUrl");

    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log("\nCleaning up test artifacts...");
    await Application.deleteMany({ _id: { $in: createdAppIds } });
    await EligibilityRule.deleteMany({ _id: { $in: createdRuleIds } });
    await Scheme.deleteMany({ _id: { $in: createdSchemeIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    console.log("Cleanup completed.");

    console.log("\n==================================================");
    console.log(`Phase 1 Test Summary: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
    console.log("==================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Phase 1 test suite failed with error:", err);
    process.exit(1);
  } finally {
    await disconnectTestDB();
    console.log("Database disconnected.");
  }
}

runPhase1Tests();
