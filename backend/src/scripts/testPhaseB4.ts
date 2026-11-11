/**
 * testPhaseB4.ts
 *
 * Dedicated Automated Test Suite for GovGuide Phase B.4:
 * Database Isolation, Production Protection, and Verification Lifecycle Fixes.
 *
 * Test Group A: Database Isolation (Dedicated govguide_test, fallback prevention, targeted cleanup)
 * Test Group B: Production Protection (NODE_ENV=production, production URIs, ambiguous config blocking)
 * Test Group C: Verification Lifecycle (Verified -> Unverified, Verified -> Disputed, Evidence-gated Verification)
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/testPhaseB4.ts
 */

import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import {
  validateTestEnvironment,
  connectTestDB,
  disconnectTestDB,
  cleanTestRecords,
  DEFAULT_TEST_MONGODB_URI,
} from "../config/testDb";
import { IngestionService } from "../pipeline/services/ingestionService";
import { JsonAdapter } from "../pipeline/adapters/jsonAdapter";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runPhaseB4Tests(): Promise<void> {
  console.log("================================================================================");
  console.log(" GOVGUIDE PHASE B.4 AUTOMATED VERIFICATION SUITE");
  console.log(" Database Isolation, Production Protection & Verification Lifecycle");
  console.log("================================================================================\n");

  // =============================================================================
  // TEST GROUP A: Database Isolation
  // =============================================================================
  console.log("--- TEST GROUP A: Database Isolation & Fallback Prevention ---");

  // A1: validateTestEnvironment resolves to dedicated test database by default
  const defaultValidation = validateTestEnvironment();
  assert(
    defaultValidation.isValid === true,
    "validateTestEnvironment confirms valid test environment"
  );
  assert(
    defaultValidation.databaseName === "govguide_test",
    `Target database defaults to 'govguide_test' (found: '${defaultValidation.databaseName}')`
  );
  assert(
    defaultValidation.testUri.includes("govguide_test"),
    "Default test URI explicitly includes 'govguide_test'"
  );

  // A2: Test execution cannot silently fall back to development database ('govguide')
  let devFallbackBlocked = false;
  try {
    validateTestEnvironment("mongodb://127.0.0.1:27017/govguide");
  } catch (err: any) {
    if (err.message && err.message.includes("development database")) {
      devFallbackBlocked = true;
    }
  }
  assert(
    devFallbackBlocked,
    "Targeting development database ('govguide') is strictly blocked by safety guard"
  );

  // A3: Missing test database URI causes execution to abort
  let missingUriBlocked = false;
  try {
    validateTestEnvironment("");
  } catch (err: any) {
    if (err.message && err.message.includes("missing or empty")) {
      missingUriBlocked = true;
    }
  }
  assert(
    missingUriBlocked,
    "Empty or missing database URI causes immediate abortion"
  );

  // A4: Non-test database names (not containing 'test') are blocked
  let nonTestDbBlocked = false;
  try {
    validateTestEnvironment("mongodb://127.0.0.1:27017/analytics_db");
  } catch (err: any) {
    if (err.message && err.message.includes("does not designate a test database")) {
      nonTestDbBlocked = true;
    }
  }
  assert(
    nonTestDbBlocked,
    "Database names lacking 'test' indicator are rejected"
  );

  // A5: Connect to dedicated test database
  await connectTestDB();
  assert(
    mongoose.connection.readyState === 1,
    "Successfully connected to MongoDB test instance"
  );
  assert(
    mongoose.connection.name === "govguide_test",
    `Active MongoDB connection is strictly 'govguide_test' (verified: '${mongoose.connection.name}')`
  );

  // A6: Targeted cleanup deletes only test-owned records by explicit ID
  const testSchemeA = await Scheme.create({
    name: `Test Isolation Scheme A ${Date.now()}`,
    description: "Temporary scheme for verifying targeted cleanup isolation",
    category: "Education",
    level: "central",
    officialUrl: "https://education.gov.in",
    source: "Ministry of Education",
  });
  const testSchemeB = await Scheme.create({
    name: `Test Isolation Scheme B ${Date.now()}`,
    description: "Temporary scheme that must remain untouched during targeted cleanup",
    category: "Healthcare",
    level: "central",
    officialUrl: "https://mohfw.gov.in",
    source: "MoHFW",
  });

  const cleanupRes = await cleanTestRecords(
    { schemeIds: [testSchemeA._id] },
    { Scheme }
  );
  assert(
    cleanupRes.deletedCounts.schemes === 1,
    "Targeted cleanup deleted exactly 1 specified test record"
  );

  const foundA = await Scheme.findById(testSchemeA._id);
  const foundB = await Scheme.findById(testSchemeB._id);
  assert(foundA === null, "Targeted record A was cleanly removed");
  assert(foundB !== null, "Unrelated record B was completely preserved (no collection wipe)");

  // Clean up record B
  await cleanTestRecords({ schemeIds: [testSchemeB._id] }, { Scheme });

  // =============================================================================
  // TEST GROUP B: Production Protection Guards
  // =============================================================================
  console.log("\n--- TEST GROUP B: Production Protection Guards ---");

  // B1: Production NODE_ENV blocks test execution before connection
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let prodEnvBlocked = false;
  try {
    validateTestEnvironment();
  } catch (err: any) {
    if (err.message && err.message.includes("NODE_ENV=production")) {
      prodEnvBlocked = true;
    }
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
  assert(
    prodEnvBlocked,
    "NODE_ENV='production' immediately blocks execution with SAFETY VIOLATION"
  );

  // B2: Cloud / Atlas production database URI blocks tests
  let atlasUriBlocked = false;
  try {
    validateTestEnvironment("mongodb+srv://admin:pass@cluster0.govguide.mongodb.net/production_db");
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes("production or remote host") ||
        err.message.includes("remote cloud") ||
        err.message.includes("mongodb+srv"))
    ) {
      atlasUriBlocked = true;
    }
  }
  assert(
    atlasUriBlocked,
    "MongoDB Atlas cloud host is blocked by production guard"
  );

  // B3: Remote host not in allowlist is blocked
  let prodKeywordBlocked = false;
  try {
    validateTestEnvironment("mongodb://db-prod-primary.internal:27017/govguide_test");
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes("approved local test host allowlist") ||
        err.message.includes("production or remote host"))
    ) {
      prodKeywordBlocked = true;
    }
  }
  assert(
    prodKeywordBlocked,
    "Remote host is blocked by strict host allowlist"
  );

  // B4: Malformed URI without scheme protocol is rejected
  let badProtocolBlocked = false;
  try {
    validateTestEnvironment("localhost:27017/govguide_test");
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes("Invalid database URI format") ||
        err.message.includes("Malformed database URI"))
    ) {
      badProtocolBlocked = true;
    }
  }
  assert(
    badProtocolBlocked,
    "URI missing 'mongodb://' or 'mongodb+srv://' is rejected"
  );

  // B5: Normal development test execution remains allowed
  const safeValidation = validateTestEnvironment(DEFAULT_TEST_MONGODB_URI);
  assert(
    safeValidation.isValid && safeValidation.databaseName === "govguide_test",
    "Normal local test database URI ('mongodb://127.0.0.1:27017/govguide_test') is safely permitted"
  );

  // =============================================================================
  // TEST GROUP C: Verification Status Lifecycle & Metadata
  // =============================================================================
  console.log("\n--- TEST GROUP C: Verification Status Lifecycle & Metadata ---");

  const createdSchemeIds: mongoose.Types.ObjectId[] = [];

  try {
    // C1: Existing 'verified' + Incoming explicit 'unverified' -> Downgrade to 'unverified' & Clear verifiedAt
    const initialVerifiedDate = new Date("2026-01-15T10:00:00.000Z");
    const scheme1Name = `Lifecycle Test Verified to Unverified ${Date.now()}`;
    const scheme1 = await Scheme.create({
      name: scheme1Name,
      description: "Scheme created as verified to test explicit downgrade",
      category: "Social Welfare",
      level: "central",
      officialUrl: "https://socialjustice.gov.in",
      source: "Ministry of Social Justice",
      verificationStatus: "verified",
      verifiedAt: initialVerifiedDate,
      sourceDocumentTitle: "Original Verified Document",
    });
    createdSchemeIds.push(scheme1._id as mongoose.Types.ObjectId);

    const downgradeAdapter = new JsonAdapter({
      jsonData: [
        {
          name: scheme1Name,
          description: "Scheme created as verified to test explicit downgrade",
          category: "Social Welfare",
          level: "central",
          officialUrl: "https://socialjustice.gov.in",
          source: "Ministry of Social Justice",
          verificationStatus: "unverified", // Explicit downgrade!
        },
      ],
    });
    await IngestionService.ingest(downgradeAdapter, { allowUpdates: true });

    const reloaded1 = await Scheme.findById(scheme1._id);
    assert(
      reloaded1?.verificationStatus === "unverified",
      "Existing 'verified' + incoming explicit 'unverified' -> status updated to 'unverified'"
    );
    assert(
      !reloaded1?.verifiedAt,
      "verifiedAt timestamp is cleared (null/undefined) upon downgrade to unverified"
    );

    // C2: Existing 'verified' + Incoming explicit 'disputed' -> Downgrade to 'disputed' & Clear verifiedAt
    const scheme2Name = `Lifecycle Test Verified to Disputed ${Date.now()}`;
    const scheme2 = await Scheme.create({
      name: scheme2Name,
      description: "Scheme created as verified to test dispute status update",
      category: "Agriculture",
      level: "central",
      officialUrl: "https://agricoop.gov.in",
      source: "Ministry of Agriculture",
      verificationStatus: "verified",
      verifiedAt: initialVerifiedDate,
      sourceDocumentTitle: "Agriculture Guidelines",
    });
    createdSchemeIds.push(scheme2._id as mongoose.Types.ObjectId);

    const disputeAdapter = new JsonAdapter({
      jsonData: [
        {
          name: scheme2Name,
          description: "Scheme created as verified to test dispute status update",
          category: "Agriculture",
          level: "central",
          officialUrl: "https://agricoop.gov.in",
          source: "Ministry of Agriculture",
          verificationStatus: "disputed", // Explicit dispute!
        },
      ],
    });
    await IngestionService.ingest(disputeAdapter, { allowUpdates: true });

    const reloaded2 = await Scheme.findById(scheme2._id);
    assert(
      reloaded2?.verificationStatus === "disputed",
      "Existing 'verified' + incoming explicit 'disputed' -> status updated to 'disputed'"
    );
    assert(
      !reloaded2?.verifiedAt,
      "verifiedAt timestamp is cleared (null/undefined) upon transition to disputed"
    );

    // C3: Existing 'verified' + Missing incoming status -> Preserve existing 'verified' & Preserve verifiedAt
    const scheme3Name = `Lifecycle Test Missing Incoming Status ${Date.now()}`;
    const scheme3 = await Scheme.create({
      name: scheme3Name,
      description: "Scheme created as verified with incoming update omitting verificationStatus",
      category: "Employment",
      level: "central",
      officialUrl: "https://labour.gov.in",
      source: "Ministry of Labour",
      verificationStatus: "verified",
      verifiedAt: initialVerifiedDate,
      sourceDocumentTitle: "National Employment Framework",
    });
    createdSchemeIds.push(scheme3._id as mongoose.Types.ObjectId);

    const missingStatusAdapter = new JsonAdapter({
      jsonData: [
        {
          name: scheme3Name,
          description: "Updated description for employment scheme with omitted status",
          category: "Employment",
          level: "central",
          officialUrl: "https://labour.gov.in",
          source: "Ministry of Labour",
          // verificationStatus is deliberately OMITTED!
        },
      ],
    });
    await IngestionService.ingest(missingStatusAdapter, { allowUpdates: true });

    const reloaded3 = await Scheme.findById(scheme3._id);
    assert(
      reloaded3?.verificationStatus === "verified",
      "Existing 'verified' + missing incoming status -> existing 'verified' status preserved"
    );
    assert(
      Boolean(reloaded3?.verifiedAt && reloaded3.verifiedAt.getTime() === initialVerifiedDate.getTime()),
      "verifiedAt timestamp is preserved without unnecessary timestamp change"
    );
    assert(
      reloaded3?.description === "Updated description for employment scheme with omitted status",
      "Unrelated metadata (description) was updated successfully without collateral damage"
    );

    // C4: Existing 'unverified' + Incoming 'verified' WITH evidence -> Transition to 'verified'
    const scheme4Name = `Lifecycle Test Unverified to Verified With Evidence ${Date.now()}`;
    const scheme4 = await Scheme.create({
      name: scheme4Name,
      description: "Scheme starting unverified that gains official verification evidence",
      category: "Women & Child",
      level: "central",
      officialUrl: "https://wcd.nic.in",
      source: "Ministry of Women and Child Development",
      verificationStatus: "unverified",
    });
    createdSchemeIds.push(scheme4._id as mongoose.Types.ObjectId);

    const verifiedWithEvidenceAdapter = new JsonAdapter({
      jsonData: [
        {
          name: scheme4Name,
          description: "Scheme starting unverified that gains official verification evidence",
          category: "Women & Child",
          level: "central",
          officialUrl: "https://wcd.nic.in",
          source: "Ministry of Women and Child Development",
          verificationStatus: "verified",
          sourceDocumentTitle: "WCD Official Policy Framework 2026",
          verifiedBy: "GovGuide Senior Audit Team",
        },
      ],
    });
    await IngestionService.ingest(verifiedWithEvidenceAdapter, { allowUpdates: true });

    const reloaded4 = await Scheme.findById(scheme4._id);
    assert(
      reloaded4?.verificationStatus === "verified",
      "Existing 'unverified' + incoming 'verified' WITH evidence -> transitioned to 'verified'"
    );
    assert(
      Boolean(reloaded4?.verifiedAt),
      "verifiedAt timestamp was automatically set upon valid verification"
    );
    assert(
      reloaded4?.sourceDocumentTitle === "WCD Official Policy Framework 2026",
      "Incoming evidence document title was stored correctly"
    );

    // C5: Existing 'unverified' + Incoming 'verified' WITHOUT evidence -> Remains 'unverified'
    const scheme5Name = `Lifecycle Test Unverified With Inadequate Evidence ${Date.now()}`;
    const scheme5 = await Scheme.create({
      name: scheme5Name,
      description: "Scheme starting unverified with claims of verification lacking evidence",
      category: "Housing",
      level: "central",
      officialUrl: "https://mohua.gov.in",
      source: "MoHUA",
      verificationStatus: "unverified",
    });
    createdSchemeIds.push(scheme5._id as mongoose.Types.ObjectId);

    const verifiedWithoutEvidenceAdapter = new JsonAdapter({
      jsonData: [
        {
          name: scheme5Name,
          description: "Scheme starting unverified with claims of verification lacking evidence",
          category: "Housing",
          level: "central",
          officialUrl: "https://mohua.gov.in",
          source: "MoHUA",
          verificationStatus: "verified",
          // Deliberately NO sourceDocumentTitle, NO verifiedBy, NO officialDocUrl!
        },
      ],
    });
    await IngestionService.ingest(verifiedWithoutEvidenceAdapter, { allowUpdates: true });

    const reloaded5 = await Scheme.findById(scheme5._id);
    assert(
      reloaded5?.verificationStatus === "unverified",
      "Existing 'unverified' + incoming 'verified' WITHOUT evidence -> remains 'unverified' (blind verification prevented)"
    );
    assert(
      !reloaded5?.verifiedAt,
      "verifiedAt remains unset when verification evidence is inadequate"
    );
  } finally {
    // Clean up test-created schemes by ID exclusively
    if (createdSchemeIds.length > 0) {
      await cleanTestRecords({ schemeIds: createdSchemeIds }, { Scheme });
      console.log(`  Cleaned up ${createdSchemeIds.length} isolated test records.`);
    }
  }

  // Final Disconnect
  await disconnectTestDB();

  console.log("\n================================================================================");
  console.log(` PHASE B.4 TEST SUMMARY: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhaseB4Tests().catch(async (err) => {
    console.error("Test execution failed with unhandled exception:", err);
    await disconnectTestDB();
    process.exit(1);
  });
}
