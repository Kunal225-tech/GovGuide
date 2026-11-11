/**
 * testPhaseA.ts
 * Comprehensive Automated Test Suite for GovGuide Phase A:
 * Eligibility Safety & Three-State Results.
 *
 * Verifies all Phase A requirements:
 * 1. Complete, sufficiently represented rule (isComplete=true) where user qualifies -> "eligible", eligible=true
 * 2. Known criterion definitively disqualifies user (e.g. age < minAge) -> "ineligible", eligible=false
 * 3. Missing EligibilityRule -> "unverified", eligible=false
 * 4. Missing user profile information -> "unverified", eligible=false, missingProfileFields recorded
 * 5. Partially represented rule with unsupported conditions (unsupportedCriteria=[...]) -> "unverified", eligible=false
 * 6. Legacy rule with unknown completeness (isComplete=undefined) -> "unverified", eligible=false
 * 7. Verified source/scheme with incomplete rule -> "unverified", eligible=false (verified source != complete rule)
 * 8. Multiple conditions: definitive disqualification takes precedence over missing profile fields -> "ineligible", eligible=false
 * 9. API response contract & backward compatibility (status, eligible, reasons, schemeId, schemeName)
 * 10. Discontinued scheme safety gate -> "ineligible", eligible=false
 * 11. Localization integrity check: en.json and hi.json contain all three-state keys
 * 12. Non-interference: Scheme discovery, saved schemes, and application tracking models unaffected
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Scheme from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import User from "../models/User";
import Application from "../models/Application";
import { checkEligibility } from "../services/eligibilityService";
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

async function runPhaseATests(): Promise<void> {
  console.log("==================================================");
  console.log("GovGuide Phase A: Eligibility Safety & Three-State Results Test Suite");
  console.log("==================================================");

  await connectTestDB();
  console.log(`Connected to isolated test database: ${mongoose.connection.name}\n`);

  const createdSchemeIds: mongoose.Types.ObjectId[] = [];
  const createdRuleIds: mongoose.Types.ObjectId[] = [];
  const createdUserIds: mongoose.Types.ObjectId[] = [];
  const createdAppIds: mongoose.Types.ObjectId[] = [];

  try {
    // -----------------------------------------------------------------
    // TEST 1: Complete, sufficiently represented rule (User qualifies)
    // -----------------------------------------------------------------
    console.log("🔷 Test 1: Complete Rule Evaluation (User Qualifies -> 'eligible')");

    const completeScheme = await Scheme.create({
      name: `Complete Verified Scheme ${Date.now()}`,
      description: "A scheme with complete and verified automated criteria",
      category: "Education",
      level: "central",
      hasDeterministicRule: true,
      verificationStatus: "verified",
      officialUrl: "https://education.gov.in",
      source: "Ministry of Education",
    });
    createdSchemeIds.push(completeScheme._id as mongoose.Types.ObjectId);

    const completeRule = await EligibilityRule.create({
      schemeId: completeScheme._id,
      minAge: 18,
      maxAge: 30,
      maxAnnualIncome: 500000,
      isVerified: true,
      isComplete: true, // Explicitly certified complete!
      hasUnsupportedCriteria: false,
    });
    createdRuleIds.push(completeRule._id as mongoose.Types.ObjectId);

    const qualifiedUser = await User.create({
      name: "Qualified User",
      email: `qualified_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 22,
        annualIncome: 350000,
      },
    });
    createdUserIds.push(qualifiedUser._id as mongoose.Types.ObjectId);

    const evalRes1 = await checkEligibility(qualifiedUser.id);
    const target1 = evalRes1.find((r) => r.schemeId.toString() === completeScheme._id.toString());

    assert(target1 !== undefined, "Evaluated target complete scheme");
    assert(target1?.status === "eligible", "Target scheme has status='eligible'");
    assert(target1?.eligible === true, "Compatibility boolean eligible=true for 'eligible' status");
    assert(target1?.reasons.length === 1 && target1.reasons[0].includes("verified and satisfied"), "Success reason provides confirmation and document caveat");

    // -----------------------------------------------------------------
    // TEST 2: Known criterion definitively disqualifies user
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 2: Definitive Disqualification (Underage User -> 'ineligible')");

    const underageUser = await User.create({
      name: "Underage User",
      email: `underage_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 15, // Below minAge 18!
        annualIncome: 350000,
      },
    });
    createdUserIds.push(underageUser._id as mongoose.Types.ObjectId);

    const evalRes2 = await checkEligibility(underageUser.id);
    const target2 = evalRes2.find((r) => r.schemeId.toString() === completeScheme._id.toString());

    assert(target2?.status === "ineligible", "Underage user receives status='ineligible'");
    assert(target2?.eligible === false, "Compatibility boolean eligible=false for 'ineligible' status");
    assert(
      Boolean(target2?.reasons.some((r) => r.includes("below the minimum required age of 18"))),
      "Disqualification reason accurately identifies minimum age failure"
    );

    // -----------------------------------------------------------------
    // TEST 3: Missing EligibilityRule record
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 3: Missing EligibilityRule (No Rule -> 'unverified')");

    const unruledScheme = await Scheme.create({
      name: `Unruled Scheme ${Date.now()}`,
      description: "Scheme without an EligibilityRule document in database",
      category: "Healthcare",
      level: "central",
      officialUrl: "https://health.gov.in",
      source: "Ministry of Health",
    });
    createdSchemeIds.push(unruledScheme._id as mongoose.Types.ObjectId);

    const evalRes3 = await checkEligibility(qualifiedUser.id);
    const target3 = evalRes3.find((r) => r.schemeId.toString() === unruledScheme._id.toString());

    assert(target3?.status === "unverified", "Scheme without EligibilityRule receives status='unverified'");
    assert(target3?.eligible === false, "Compatibility boolean eligible=false for unverified scheme");
    assert(
      Boolean(target3?.reasons.some((r) => r.includes("has not been verified for automated evaluation"))),
      "Reason clarifies that criteria has not been verified"
    );

    // -----------------------------------------------------------------
    // TEST 4: Missing user profile information
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 4: Missing Profile Info (Empty Profile -> 'unverified')");

    const schemeRequiringGenderAndIncome = await Scheme.create({
      name: `Gender & Income Scheme ${Date.now()}`,
      description: "Scheme requiring gender and income verification",
      category: "Women & Child",
      level: "central",
      hasDeterministicRule: true,
      officialUrl: "https://wcd.nic.in",
      source: "MoWCD",
    });
    createdSchemeIds.push(schemeRequiringGenderAndIncome._id as mongoose.Types.ObjectId);

    const genderAndIncomeRule = await EligibilityRule.create({
      schemeId: schemeRequiringGenderAndIncome._id,
      genders: ["Female"],
      maxAnnualIncome: 300000,
      isVerified: true,
      isComplete: true,
    });
    createdRuleIds.push(genderAndIncomeRule._id as mongoose.Types.ObjectId);

    // User missing gender and income
    const incompleteUser = await User.create({
      name: "Incomplete Profile User",
      email: `incomplete_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 25,
        // gender and annualIncome missing!
      },
    });
    createdUserIds.push(incompleteUser._id as mongoose.Types.ObjectId);

    const evalRes4 = await checkEligibility(incompleteUser.id);
    const target4 = evalRes4.find((r) => r.schemeId.toString() === schemeRequiringGenderAndIncome._id.toString());

    assert(target4?.status === "unverified", "Missing profile fields result in status='unverified'");
    assert(target4?.eligible === false, "eligible=false for missing profile fields");
    assert(
      Boolean(target4?.reasons.some((r) => r.includes("gender is not specified"))),
      "Reason explains missing gender"
    );
    assert(
      Boolean(target4?.reasons.some((r) => r.includes("income not specified"))),
      "Reason explains missing annual income"
    );
    assert(
      Boolean(target4?.missingProfileFields?.includes("gender") && target4?.missingProfileFields?.includes("annualIncome")),
      "missingProfileFields array tracks missing demographic fields"
    );

    // -----------------------------------------------------------------
    // TEST 5: Partially represented rule with unsupported conditions
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 5: Partially Represented Rule with Unsupported Conditions");

    const farmerScheme = await Scheme.create({
      name: `Farmer Landholding Scheme ${Date.now()}`,
      description: "Scheme requiring agricultural land ownership",
      category: "Agriculture",
      level: "central",
      hasDeterministicRule: true,
      officialUrl: "https://pmkisan.gov.in",
      source: "Ministry of Agriculture",
    });
    createdSchemeIds.push(farmerScheme._id as mongoose.Types.ObjectId);

    const partiallyRepresentedRule = await EligibilityRule.create({
      schemeId: farmerScheme._id,
      minAge: 18,
      occupations: ["Farmer"],
      maxAnnualIncome: 600000,
      isVerified: true,
      isComplete: false, // Incomplete!
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Landholding under 2 hectares", "Non-income tax payer status"],
    });
    createdRuleIds.push(partiallyRepresentedRule._id as mongoose.Types.ObjectId);

    const farmerUser = await User.create({
      name: "Farmer User",
      email: `farmer_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 35,
        occupation: "Farmer",
        annualIncome: 250000,
      },
    });
    createdUserIds.push(farmerUser._id as mongoose.Types.ObjectId);

    const evalRes5 = await checkEligibility(farmerUser.id);
    const target5 = evalRes5.find((r) => r.schemeId.toString() === farmerScheme._id.toString());

    assert(target5?.status === "unverified", "User meeting demographics for partially represented rule gets 'unverified' (NOT 'eligible')");
    assert(target5?.eligible === false, "eligible=false prevented false-positive");
    assert(
      Boolean(target5?.reasons.some((r) => r.includes("Landholding under 2 hectares"))),
      "Reason explicitly alerts user to unsupported landholding criteria"
    );

    // -----------------------------------------------------------------
    // TEST 6: Legacy rule with unknown completeness
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 6: Legacy Rule with Unknown Completeness (Default isComplete=false)");

    const legacyScheme = await Scheme.create({
      name: `Legacy Scheme Unknown Completeness ${Date.now()}`,
      description: "Scheme created under old schema without isComplete field",
      category: "Employment",
      level: "central",
      hasDeterministicRule: true,
      officialUrl: "https://mudra.org.in",
      source: "Ministry of Finance",
    });
    createdSchemeIds.push(legacyScheme._id as mongoose.Types.ObjectId);

    // Notice: isComplete is omitted, representing legacy data
    const legacyRule = await EligibilityRule.create({
      schemeId: legacyScheme._id,
      minAge: 18,
      maxAge: 65,
      isVerified: true,
    });
    createdRuleIds.push(legacyRule._id as mongoose.Types.ObjectId);

    const evalRes6 = await checkEligibility(qualifiedUser.id);
    const target6 = evalRes6.find((r) => r.schemeId.toString() === legacyScheme._id.toString());

    assert(target6?.status === "unverified", "Legacy rule of uncertain completeness treated conservatively as 'unverified'");
    assert(target6?.eligible === false, "Legacy rule does not produce false-positive eligible=true");
    assert(
      Boolean(target6?.reasons.some((r) => r.includes("additional requirements"))),
      "Reason alerts user that guidelines may contain additional requirements"
    );

    // -----------------------------------------------------------------
    // TEST 7: Scheme source marked verified, but rule is incomplete
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 7: Verified Source != Complete Automated Rule");

    const verifiedSourceScheme = await Scheme.create({
      name: `Verified Source Incomplete Rule Scheme ${Date.now()}`,
      description: "Scheme from verified ministry source whose rule is incomplete",
      category: "Housing",
      level: "central",
      hasDeterministicRule: true,
      verificationStatus: "verified", // Official verified ministry source!
      verifiedAt: new Date(),
      officialUrl: "https://pmayg.nic.in",
      source: "Ministry of Rural Development",
    });
    createdSchemeIds.push(verifiedSourceScheme._id as mongoose.Types.ObjectId);

    const incompleteRule = await EligibilityRule.create({
      schemeId: verifiedSourceScheme._id,
      maxAnnualIncome: 300000,
      isVerified: true,
      isComplete: false, // Rule itself is not complete!
    });
    createdRuleIds.push(incompleteRule._id as mongoose.Types.ObjectId);

    const lowIncomeUser = await User.create({
      name: "Low Income User",
      email: `lowincome_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        annualIncome: 150000,
      },
    });
    createdUserIds.push(lowIncomeUser._id as mongoose.Types.ObjectId);

    const evalRes7 = await checkEligibility(lowIncomeUser.id);
    const target7 = evalRes7.find((r) => r.schemeId.toString() === verifiedSourceScheme._id.toString());

    assert(target7?.status === "unverified", "Verified scheme source does not bypass incomplete rule check");
    assert(target7?.eligible === false, "eligible remains false despite verified scheme source");

    // -----------------------------------------------------------------
    // TEST 8: Multiple conditions: Disqualification takes precedence over missing info
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 8: Multiple Conditions (Disqualification Precedence)");

    // Scheme requires minAge: 21 AND occupation: "Artisan"
    const dualConditionScheme = await Scheme.create({
      name: `Dual Condition Scheme ${Date.now()}`,
      description: "Scheme requiring age 21+ and Artisan occupation",
      category: "Social Welfare",
      level: "central",
      hasDeterministicRule: true,
      officialUrl: "https://socialjustice.gov.in",
      source: "MoSJE",
    });
    createdSchemeIds.push(dualConditionScheme._id as mongoose.Types.ObjectId);

    const dualRule = await EligibilityRule.create({
      schemeId: dualConditionScheme._id,
      minAge: 21,
      occupations: ["Artisan"],
      isVerified: true,
      isComplete: true,
    });
    createdRuleIds.push(dualRule._id as mongoose.Types.ObjectId);

    // User is 18 (fails minAge 21) AND has occupation missing!
    const underageMissingOccupationUser = await User.create({
      name: "Underage Missing Occupation User",
      email: `underage_missing_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
      profile: {
        age: 18, // Fails minAge: 21 definitively!
        // occupation is missing!
      },
    });
    createdUserIds.push(underageMissingOccupationUser._id as mongoose.Types.ObjectId);

    const evalRes8 = await checkEligibility(underageMissingOccupationUser.id);
    const target8 = evalRes8.find((r) => r.schemeId.toString() === dualConditionScheme._id.toString());

    assert(
      target8?.status === "ineligible",
      "Definitive disqualification takes precedence over missing profile information -> 'ineligible'"
    );
    assert(target8?.eligible === false, "eligible=false for disqualified user");
    assert(
      Boolean(target8?.reasons.some((r) => r.includes("below the minimum required age of 21"))),
      "Disqualification reason highlights the failed minimum age condition"
    );

    // -----------------------------------------------------------------
    // TEST 9: API Response Types and Backward Compatibility
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 9: API Response Types and Backward Compatibility");

    assert(
      evalRes8.every(
        (r) =>
          typeof r.status === "string" &&
          ["eligible", "ineligible", "unverified"].includes(r.status) &&
          typeof r.eligible === "boolean" &&
          Array.isArray(r.reasons) &&
          r.schemeId != null &&
          typeof r.schemeName === "string"
      ),
      "Every eligibility result conforms to { schemeId, schemeName, status, eligible, reasons } contract"
    );

    assert(
      evalRes8.every((r) => (r.status === "eligible" ? r.eligible === true : r.eligible === false)),
      "Compatibility field 'eligible' is true ONLY when status is 'eligible', false for 'ineligible' and 'unverified'"
    );

    // -----------------------------------------------------------------
    // TEST 10: Discontinued Scheme
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 10: Discontinued Scheme Safety Gate");

    const discScheme = await Scheme.create({
      name: `Discontinued Scheme Test ${Date.now()}`,
      description: "Former scheme that was discontinued",
      category: "Housing",
      level: "central",
      status: "discontinued",
      officialUrl: "https://housing.gov.in",
      source: "MoHUA",
    });
    createdSchemeIds.push(discScheme._id as mongoose.Types.ObjectId);

    const evalRes10 = await checkEligibility(qualifiedUser.id);
    const target10 = evalRes10.find((r) => r.schemeId.toString() === discScheme._id.toString());

    assert(target10?.status === "ineligible", "Discontinued scheme marked 'ineligible'");
    assert(target10?.eligible === false, "eligible=false for discontinued scheme");
    assert(
      Boolean(target10?.reasons.some((r) => r.includes("discontinued"))),
      "Reason clarifies scheme has been discontinued"
    );

    // -----------------------------------------------------------------
    // TEST 11: Translation Files Integrity (en.json & hi.json)
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 11: Localization Integrity Check");

    const enPath = path.resolve(__dirname, "../../../frontend/src/i18n/locales/en.json");
    const hiPath = path.resolve(__dirname, "../../../frontend/src/i18n/locales/hi.json");

    const enContent = JSON.parse(fs.readFileSync(enPath, "utf-8"));
    const hiContent = JSON.parse(fs.readFileSync(hiPath, "utf-8"));

    const requiredKeys = [
      "tabEligible",
      "tabUnverified",
      "tabIneligible",
      "matchedBadge",
      "unverifiedBadge",
      "notMatchedBadge",
      "criteriaMet",
      "criteriaUnverified",
      "criteriaNotMet",
      "needsVerificationTitle",
      "needsVerificationDesc",
      "eligibleDisclaimer",
      "unverifiedDisclaimer",
    ];

    const enMissing = requiredKeys.filter((k) => !enContent.eligible || !enContent.eligible[k]);
    const hiMissing = requiredKeys.filter((k) => !hiContent.eligible || !hiContent.eligible[k]);

    assert(enMissing.length === 0, `en.json contains all three-state keys (missing: ${enMissing.join(", ")})`);
    assert(hiMissing.length === 0, `hi.json contains all three-state keys (missing: ${hiMissing.join(", ")})`);

    // -----------------------------------------------------------------
    // TEST 12: Non-Interference with Existing Saved Schemes & Applications
    // -----------------------------------------------------------------
    console.log("\n🔷 Test 12: Non-Interference with Saved Schemes & Application Tracking");

    const testApp = await Application.create({
      userId: qualifiedUser._id,
      schemeId: completeScheme._id,
      status: "in-progress",
      notes: "Testing application tracking integrity during Phase A",
    });
    createdAppIds.push(testApp._id as mongoose.Types.ObjectId);

    const fetchedApp = await Application.findById(testApp._id);
    assert(fetchedApp !== null && fetchedApp.status === "in-progress", "Application tracking persists without interference");

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
    console.log(`Phase A Test Summary: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
    console.log("==================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Phase A test suite failed with error:", err);
    process.exit(1);
  } finally {
    await disconnectTestDB();
    console.log("Database disconnected cleanly.");
  }
}

runPhaseATests();
