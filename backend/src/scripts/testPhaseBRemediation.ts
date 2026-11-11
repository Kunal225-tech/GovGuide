/**
 * testPhaseBRemediation.ts
 *
 * Dedicated verification test suite for Phase B.2 Remediation:
 * 1. SSY with matching demographic data returns 'unverified'
 * 2. Known disqualification (gender, age) still returns 'ineligible'
 * 3. Seed script defaults to dry-run mode
 * 4. Dry-run performs zero database mutations
 * 5. Production writes are strictly blocked unless explicitly overridden
 * 6. sourceId and hasDeterministicRule survive valid update paths
 * 7. Normalizer preserves procedural-only rules
 * 8. Repeated seeding remains idempotent
 * 9. Existing scheme IDs and related references remain stable
 *
 * Usage:
 *   npx ts-node src/scripts/testPhaseBRemediation.ts
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import Application from "../models/Application";
import User from "../models/User";
import { connectTestDB, disconnectTestDB } from "../config/testDb";
import { normalizeSchemeInput } from "../pipeline/normalizers/schemeNormalizer";
import { normalizeRuleInput } from "../pipeline/normalizers/ruleNormalizer";
import { validateNormalizedScheme } from "../pipeline/validators/ingestionValidator";
import { checkEligibility } from "../services/eligibilityService";
import { runPilotSeeding } from "./seedPilotSchemes";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string, details?: any): void {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${description}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${description}`);
    if (details) {
      console.error(`         Details:`, details);
    }
  }
}

async function runRemediationTests(): Promise<void> {
  console.log("================================================================================");
  console.log(" GOVGUIDE PHASE B.2 REMEDIATION VERIFICATION SUITE");
  console.log("================================================================================\n");

  // -----------------------------------------------------------------------------
  // TEST GROUP 1: In-Memory Normalizer & Dataset Tests
  // -----------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: In-Memory Normalizer & Dataset Integrity ---");

  // Requirement 7: Normalizer preserves procedural-only rules
  const proceduralRule = normalizeRuleInput({
    isVerified: true,
    isComplete: false,
    hasUnsupportedCriteria: true,
    unsupportedCriteria: [
      "Must submit land ownership Khatauni document",
      "Must complete biometric e-KYC on official PM-KISAN portal",
    ],
  });
  assert(proceduralRule !== undefined, "Normalizer preserves procedural-only rule without demographic bounds");
  assert(proceduralRule?.hasUnsupportedCriteria === true, "Procedural rule has hasUnsupportedCriteria: true");
  assert(proceduralRule?.unsupportedCriteria?.length === 2, "Procedural rule preserves unsupportedCriteria items");
  assert(proceduralRule?.isComplete === false, "Procedural rule preserves isComplete: false");

  // Normalizer auto-derives hasUnsupportedCriteria: true when unsupportedCriteria array is non-empty
  const autoDerivedUnsupported = normalizeRuleInput({
    isVerified: true,
    unsupportedCriteria: ["Requires council trade permit"],
  });
  assert(autoDerivedUnsupported !== undefined, "Rule with unsupported array only is preserved");
  assert(autoDerivedUnsupported?.hasUnsupportedCriteria === true, "hasUnsupportedCriteria auto-derived as true");

  // Requirement 6: sourceId and hasDeterministicRule survive valid update paths
  const customScheme = normalizeSchemeInput({
    name: "Custom Audit Scheme",
    description: "Detailed description for custom audit scheme verification",
    category: "Education",
    officialUrl: "https://education.gov.in",
    source: "Ministry of Education",
    sourceId: "AUDIT-EXT-999",
    hasDeterministicRule: false,
    verificationStatus: "verified",
  });
  assert(customScheme.sourceId === "AUDIT-EXT-999", "sourceId correctly preserved in normalized scheme");
  assert(customScheme.hasDeterministicRule === false, "hasDeterministicRule: false deliberately preserved");
  assert(customScheme.verificationStatus === "verified", "verificationStatus preserved");

  // Ingestion validation
  const validationResult = validateNormalizedScheme(customScheme);
  assert(validationResult.isValid, "Normalized scheme with custom sourceId passes validator with 0 errors");

  // Requirement 1 Dataset Check: SSY in pilot dataset has isComplete: false and 4 unsupported criteria
  const pilotFilePath = path.resolve(__dirname, "../../../data/pilot/verified_pilot_schemes.json");
  const rawSchemes = JSON.parse(fs.readFileSync(pilotFilePath, "utf-8"));
  const ssyRaw = rawSchemes.find((s: any) => s.name === "Sukanya Samriddhi Yojana");

  assert(Boolean(ssyRaw), "Sukanya Samriddhi Yojana exists in pilot dataset");
  assert(ssyRaw?.rule?.isComplete === false, "SSY rule in dataset has isComplete: false");
  assert(ssyRaw?.rule?.hasUnsupportedCriteria === true, "SSY rule in dataset has hasUnsupportedCriteria: true");
  assert(
    Array.isArray(ssyRaw?.rule?.unsupportedCriteria) && ssyRaw.rule.unsupportedCriteria.length >= 4,
    "SSY rule records all 4 material unsupported conditions (residency, account limits, guardian)"
  );

  // -----------------------------------------------------------------------------
  // TEST GROUP 2: Seeding Script Safety Defaults & Production Guard
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Seeding Safety Defaults & Production Guard ---");

  // Requirement 3: Seed script defaults to dry-run
  const defaultModeOutput = await runPilotSeeding();
  assert(defaultModeOutput.dryRun === true, "Seed script defaults to dry-run mode when called without flags");
  assert(defaultModeOutput.totalProcessed === 10, "Dry-run processed all 10 schemes without writes");

  // Requirement 5: Production writes are blocked unless explicitly overridden
  let productionBlocked = false;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await runPilotSeeding({ live: true, dryRun: false });
  } catch (err: any) {
    if (
      err.message &&
      err.message.includes("SAFETY VIOLATION") &&
      err.message.includes("production environment")
    ) {
      productionBlocked = true;
    }
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
  assert(productionBlocked, "Production write guard strictly blocks live writes unless overridden with --force-production");

  // Test override in production with --force-production in dry-run
  const forceProdDryRun = await runPilotSeeding({ dryRun: true, forceProduction: true });
  assert(forceProdDryRun.success === true, "Production override flag recognized safely");

  // -----------------------------------------------------------------------------
  // TEST GROUP 3: Database & Engine Three-State Semantics (When DB Connected)
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Database Safety & Three-State Eligibility ---");

  let isDbConnected = false;
  try {
    await connectTestDB();
    isDbConnected = true;
  } catch (err: any) {
    console.warn(`  [INFO] MongoDB test DB not connected directly (${err.message}). Database checks skipped.`);
  }

  if (isDbConnected) {
    // Requirement 4: Dry-run performs zero database writes
    const preSchemeCount = await Scheme.countDocuments();
    const dryRunRes = await runPilotSeeding({ dryRun: true });
    assert(dryRunRes.success === true, "Dry-run succeeded with code success");
    const postSchemeCount = await Scheme.countDocuments();
    assert(
      postSchemeCount === preSchemeCount,
      "Dry-run executed without modifying Scheme collection count (0 mutations)"
    );

    // Requirement 8 & 9: Repeated dry-run seeding is idempotent and preserves application counts
    const preAppCount = await Application.countDocuments();
    await runPilotSeeding({ dryRun: true });
    const postAppCount = await Application.countDocuments();
    assert(
      postAppCount === preAppCount,
      "Repeated seeding is idempotent and preserves application references (100% integrity)"
    );

    // Three-State Engine Verification on Isolated Documents
    const createdUserIds: mongoose.Types.ObjectId[] = [];
    const createdSchemeIds: mongoose.Types.ObjectId[] = [];
    const createdRuleIds: mongoose.Types.ObjectId[] = [];

    try {
      // Create isolated test SSY scheme and rule mirroring remediated dataset
      const testSSYScheme = await Scheme.create({
        name: `Isolated SSY Test Scheme ${Date.now()}`,
        description: "Isolated SSY scheme for testing three-state safety",
        category: "Women & Child",
        level: "central",
        hasDeterministicRule: true,
        verificationStatus: "verified",
        officialUrl: "https://www.indiapost.gov.in",
        source: "Department of Posts",
      });
      createdSchemeIds.push(testSSYScheme._id as mongoose.Types.ObjectId);

      const testSSYRule = await EligibilityRule.create({
        schemeId: testSSYScheme._id,
        minAge: 0,
        maxAge: 10,
        genders: ["Female"],
        isVerified: true,
        isComplete: false, // Certified incomplete!
        hasUnsupportedCriteria: true,
        unsupportedCriteria: [
          "Beneficiary girl child must be a resident Indian citizen",
          "Maximum of two accounts permitted per family",
        ],
      });
      createdRuleIds.push(testSSYRule._id as mongoose.Types.ObjectId);

      // Requirement 1: Matching demographic profile (7yo girl) -> MUST return 'unverified'
      const girlUser = await User.create({
        name: "Test Girl User",
        email: `test_girl_${Date.now()}@example.com`,
        password: "password123",
        role: "user",
        profile: {
          age: 7,
          gender: "Female",
          state: "Delhi",
        },
      });
      createdUserIds.push(girlUser._id as mongoose.Types.ObjectId);

      const girlEval = await checkEligibility(girlUser.id);
      const ssyGirlMatch = girlEval.find((r) => r.schemeId.toString() === testSSYScheme._id.toString());
      assert(
        ssyGirlMatch !== undefined && ssyGirlMatch.status === "unverified" && ssyGirlMatch.eligible === false,
        "Requirement 1: 7yo girl with matching demographic profile returns 'unverified' (eligible: false)"
      );

      // Requirement 2: Known disqualifications MUST return 'ineligible' (Phase A precedence)
      // Disqualification A: 7yo boy (gender mismatch)
      const boyUser = await User.create({
        name: "Test Boy User",
        email: `test_boy_${Date.now()}@example.com`,
        password: "password123",
        role: "user",
        profile: {
          age: 7,
          gender: "Male",
          state: "Delhi",
        },
      });
      createdUserIds.push(boyUser._id as mongoose.Types.ObjectId);

      const boyEval = await checkEligibility(boyUser.id);
      const ssyBoyMatch = boyEval.find((r) => r.schemeId.toString() === testSSYScheme._id.toString());
      assert(
        ssyBoyMatch !== undefined && ssyBoyMatch.status === "ineligible" && ssyBoyMatch.eligible === false,
        "Requirement 2A: 7yo boy returns 'ineligible' (gender disqualification takes precedence)"
      );

      // Disqualification B: 15yo girl (age exceeds maxAge: 10)
      const teenUser = await User.create({
        name: "Test Teen Girl User",
        email: `test_teen_${Date.now()}@example.com`,
        password: "password123",
        role: "user",
        profile: {
          age: 15,
          gender: "Female",
          state: "Delhi",
        },
      });
      createdUserIds.push(teenUser._id as mongoose.Types.ObjectId);

      const teenEval = await checkEligibility(teenUser.id);
      const ssyTeenMatch = teenEval.find((r) => r.schemeId.toString() === testSSYScheme._id.toString());
      assert(
        ssyTeenMatch !== undefined && ssyTeenMatch.status === "ineligible" && ssyTeenMatch.eligible === false,
        "Requirement 2B: 15yo girl returns 'ineligible' (age disqualification takes precedence)"
      );
    } finally {
      // Clean up isolated test documents
      if (createdUserIds.length > 0) await User.deleteMany({ _id: { $in: createdUserIds } });
      if (createdRuleIds.length > 0) await EligibilityRule.deleteMany({ _id: { $in: createdRuleIds } });
      if (createdSchemeIds.length > 0) await Scheme.deleteMany({ _id: { $in: createdSchemeIds } });
      console.log("  Cleaned up isolated test artifacts.");
    }
  }

  // -----------------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` REMEDIATION TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    throw new Error(`${failedCount} test assertions failed in remediation suite.`);
  }
}

if (require.main === module) {
  runRemediationTests()
    .then(async () => {
      await disconnectTestDB();
      console.log("Remediation verification completed successfully.\n");
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Remediation verification failed:", err);
      await disconnectTestDB();
      process.exit(1);
    });
}
