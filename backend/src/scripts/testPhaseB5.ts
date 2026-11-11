/**
 * testPhaseB5.ts
 *
 * Dedicated Automated Test Suite for GovGuide Phase B.5 Safety Remediation:
 * 1. Verification Evidence & Attestation Lifecycle (10 strict cases)
 * 2. Test Database Guard & Strict Host Allowlist (10 strict cases)
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/testPhaseB5.ts
 */

import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import {
  validateTestEnvironment,
  connectTestDB,
  disconnectTestDB,
  cleanTestRecords,
  parseMongoUri,
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

async function runPhaseB5Tests(): Promise<void> {
  console.log("================================================================================");
  console.log(" GOVGUIDE PHASE B.5 REGRESSION & SAFETY VERIFICATION SUITE");
  console.log(" Evidence Attestation Decoupling & Strict Loopback Host Allowlist");
  console.log("================================================================================\n");

  // =============================================================================
  // PART 1: TEST DATABASE GUARD REGRESSION (10 Cases)
  // =============================================================================
  console.log("--- PART 1: Test Database Guard & Host Allowlist (10 Cases) ---");

  // Case 1: localhost with a valid test database -> allowed
  try {
    const res1 = validateTestEnvironment("mongodb://localhost:27017/govguide_test");
    assert(res1.isValid && res1.databaseName === "govguide_test", "1. localhost with valid test database -> allowed");
  } catch (err: any) {
    assert(false, "1. localhost with valid test database -> allowed", err.message);
  }

  // Case 2: 127.0.0.1 with a valid test database -> allowed
  try {
    const res2 = validateTestEnvironment("mongodb://127.0.0.1:27017/govguide_test");
    assert(res2.isValid && res2.databaseName === "govguide_test", "2. 127.0.0.1 with valid test database -> allowed");
  } catch (err: any) {
    assert(false, "2. 127.0.0.1 with valid test database -> allowed", err.message);
  }

  // Case 3: ::1 with a valid test database -> allowed
  try {
    const res3 = validateTestEnvironment("mongodb://[::1]:27017/govguide_test");
    assert(res3.isValid && res3.databaseName === "govguide_test", "3. ::1 with valid test database -> allowed");
  } catch (err: any) {
    assert(false, "3. ::1 with valid test database -> allowed", err.message);
  }

  // Case 4: MongoDB Atlas URI with database ending in _test -> rejected
  let atlasReject = false;
  try {
    validateTestEnvironment("mongodb+srv://user:secret123@cluster0.abcde.mongodb.net/production_db_test?retryWrites=true");
  } catch (err: any) {
    if (err.message && (err.message.includes("mongodb+srv") || err.message.includes("allowlist"))) {
      atlasReject = true;
    }
  }
  assert(atlasReject, "4. MongoDB Atlas URI with database ending in _test -> rejected (bypass eliminated)");

  // Case 5: Remote public IP with _test database -> rejected
  let publicIpReject = false;
  try {
    validateTestEnvironment("mongodb://198.51.100.45:27017/govguide_test");
  } catch (err: any) {
    if (err.message && err.message.includes("approved local test host allowlist")) {
      publicIpReject = true;
    }
  }
  assert(publicIpReject, "5. Remote public IP with _test database -> rejected");

  // Case 6: Private network IP with _test database -> rejected
  let privateIpReject = false;
  try {
    validateTestEnvironment("mongodb://192.168.1.150:27017/staging_test");
  } catch (err: any) {
    if (err.message && err.message.includes("approved local test host allowlist")) {
      privateIpReject = true;
    }
  }
  assert(privateIpReject, "6. Private network IP with _test database -> rejected");

  // Case 7: Custom internal hostname with _test database -> rejected
  let internalHostReject = false;
  try {
    validateTestEnvironment("mongodb://corp-db-cluster.internal:27017/govguide_test");
  } catch (err: any) {
    if (err.message && err.message.includes("approved local test host allowlist")) {
      internalHostReject = true;
    }
  }
  assert(internalHostReject, "7. Custom internal hostname with _test database -> rejected");

  // Case 8: Unsupported URI scheme or malformed URI -> rejected
  let malformedReject = false;
  try {
    validateTestEnvironment("http://localhost:27017/govguide_test");
  } catch (err: any) {
    if (err.message && (err.message.includes("Invalid database URI format") || err.message.includes("Malformed database URI format"))) {
      malformedReject = true;
    }
  }
  assert(malformedReject, "8. Unsupported URI scheme (http://) -> rejected");

  // Case 9: Credentials and query parameters must not break parsing
  try {
    const parsed = parseMongoUri("mongodb://app_user:complex%40password@127.0.0.1:27017/govguide_test?authSource=admin&replicaSet=rs0");
    assert(
      parsed.hosts.length === 1 &&
      parsed.hosts[0] === "127.0.0.1" &&
      parsed.databaseName === "govguide_test",
      "9. Credentials and query parameters parsed safely without leakage"
    );
  } catch (err: any) {
    assert(false, "9. Credentials and query parameters parsed safely without leakage", err.message);
  }

  // Case 10: Guard must reject unsafe hosts before any database connection attempt
  let connectionPreempted = false;
  try {
    // Attempt connection with invalid host
    await connectTestDB("mongodb://malicious-remote-server.com:27017/govguide_test");
  } catch (err: any) {
    if (err.message && err.message.includes("SAFETY VIOLATION")) {
      connectionPreempted = true;
    }
  }
  assert(
    connectionPreempted,
    "10. Guard runs strictly before connection; invalid host aborted before network socket"
  );

  // =============================================================================
  // PART 2: VERIFICATION EVIDENCE & ATTESTATION LIFECYCLE (10 Cases)
  // =============================================================================
  console.log("\n--- PART 2: Verification Evidence & Attestation Lifecycle (10 Cases) ---");

  // Connect cleanly to dedicated test database
  await connectTestDB();
  assert(
    mongoose.connection.name === "govguide_test",
    "Connected to isolated test database: govguide_test"
  );

  const testSchemeIds: mongoose.Types.ObjectId[] = [];

  try {
    // 1. Official URL only -> must NOT become verified
    const s1Name = `Case 1 Official URL Only ${Date.now()}`;
    const s1 = await Scheme.create({
      name: s1Name,
      description: "Testing official URL only without reviewer attestation",
      category: "Education",
      level: "central",
      officialUrl: "https://education.gov.in",
      source: "Ministry of Education",
      verificationStatus: "unverified",
    });
    testSchemeIds.push(s1._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s1Name,
            description: "Testing official URL only without reviewer attestation",
            category: "Education",
            level: "central",
            officialUrl: "https://education.gov.in",
            source: "Ministry of Education",
            verificationStatus: "verified",
            // Deliberately NO sourceDocumentTitle, NO officialDocUrl, NO verifiedBy!
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r1 = await Scheme.findById(s1._id);
    assert(
      r1?.verificationStatus !== "verified",
      "1. Official URL only -> must NOT become verified (retained unverified)"
    );

    // 2. Document title only -> must NOT become verified
    const s2Name = `Case 2 Doc Title Only ${Date.now()}`;
    const s2 = await Scheme.create({
      name: s2Name,
      description: "Testing doc title only without official portal or reviewer",
      category: "Housing",
      level: "central",
      officialUrl: "https://mohua.gov.in",
      source: "MoHUA",
      verificationStatus: "unverified",
    });
    testSchemeIds.push(s2._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s2Name,
            description: "Testing doc title only without reviewer",
            category: "Housing",
            level: "central",
            officialUrl: "https://mohua.gov.in",
            source: "MoHUA",
            sourceDocumentTitle: "Housing Operational Framework 2026",
            verificationStatus: "verified",
            // Deliberately NO verifiedBy!
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r2 = await Scheme.findById(s2._id);
    assert(
      r2?.verificationStatus !== "verified",
      "2. Document title only without reviewer -> must NOT become verified (routed to needs-review)"
    );

    // 3. Reviewer identity only, without source provenance -> must NOT become verified
    const s3Name = `Case 3 Reviewer Only Without Provenance ${Date.now()}`;
    const s3 = await Scheme.create({
      name: s3Name,
      description: "Testing reviewer only without guideline doc title or doc URL",
      category: "Employment",
      level: "central",
      officialUrl: "https://labour.gov.in",
      source: "Ministry of Labour",
      verificationStatus: "unverified",
    });
    testSchemeIds.push(s3._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s3Name,
            description: "Testing reviewer only without guideline doc title or doc URL",
            category: "Employment",
            level: "central",
            officialUrl: "https://labour.gov.in",
            source: "Ministry of Labour",
            verifiedBy: "GovGuide Auditor John",
            verificationStatus: "verified",
            // Deliberately NO sourceDocumentTitle, NO officialDocUrl!
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r3 = await Scheme.findById(s3._id);
    assert(
      r3?.verificationStatus !== "verified",
      "3. Reviewer identity only, without source provenance -> must NOT become verified"
    );

    // 4. Valid source provenance + explicit authorized reviewer attestation -> may become verified
    const s4Name = `Case 4 Valid Provenance And Reviewer ${Date.now()}`;
    const s4 = await Scheme.create({
      name: s4Name,
      description: "Starting unverified to test valid transition to verified",
      category: "Healthcare",
      level: "central",
      officialUrl: "https://mohfw.gov.in",
      source: "MoHFW",
      verificationStatus: "unverified",
    });
    testSchemeIds.push(s4._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s4Name,
            description: "Starting unverified to test valid transition to verified",
            category: "Healthcare",
            level: "central",
            officialUrl: "https://mohfw.gov.in",
            source: "MoHFW",
            sourceDocumentTitle: "National Health Mission Operational Guidelines 2026",
            officialDocUrl: "https://mohfw.gov.in/nhm_guidelines.pdf",
            verifiedBy: "GovGuide Senior Audit Team",
            verificationStatus: "verified",
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r4 = await Scheme.findById(s4._id);
    assert(
      r4?.verificationStatus === "verified" && Boolean(r4?.verifiedAt) && r4?.verifiedBy === "GovGuide Senior Audit Team",
      "4. Valid source provenance + explicit authorized reviewer attestation -> becomes verified"
    );

    // 5. Existing verifiedBy without a new explicit attestation -> must NOT authorize a new verification
    const s5Name = `Case 5 Historical Reviewer No New Attestation ${Date.now()}`;
    const s5 = await Scheme.create({
      name: s5Name,
      description: "Scheme with historical verifiedBy that was subsequently unverified",
      category: "Agriculture",
      level: "central",
      officialUrl: "https://agricoop.gov.in",
      source: "Ministry of Agriculture",
      verificationStatus: "unverified",
      verifiedBy: "Old Historic Auditor From 2024", // Historical field in DB!
      sourceDocumentTitle: "Agriculture Operational Manual",
    });
    testSchemeIds.push(s5._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s5Name,
            description: "Update attempting to verify relying on historical DB verifiedBy",
            category: "Agriculture",
            level: "central",
            officialUrl: "https://agricoop.gov.in",
            source: "Ministry of Agriculture",
            sourceDocumentTitle: "Agriculture Operational Manual",
            verificationStatus: "verified",
            // Incoming payload has NO verifiedBy! Must NOT inherit DB's historical reviewer to authorize!
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r5 = await Scheme.findById(s5._id);
    assert(
      r5?.verificationStatus !== "verified",
      "5. Existing verifiedBy without new explicit incoming reviewer -> must NOT authorize new verification"
    );

    // 6. Explicit unverified update -> downgrade and clear verifiedAt
    const s6Name = `Case 6 Explicit Unverified Downgrade ${Date.now()}`;
    const s6 = await Scheme.create({
      name: s6Name,
      description: "Scheme created verified to test unverified downgrade",
      category: "Social Welfare",
      level: "central",
      officialUrl: "https://socialjustice.gov.in",
      source: "MoSJ",
      verificationStatus: "verified",
      verifiedAt: new Date("2026-02-01"),
      verifiedBy: "Audit Team",
    });
    testSchemeIds.push(s6._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s6Name,
            description: "Scheme created verified to test unverified downgrade",
            category: "Social Welfare",
            level: "central",
            officialUrl: "https://socialjustice.gov.in",
            source: "MoSJ",
            verificationStatus: "unverified",
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r6 = await Scheme.findById(s6._id);
    assert(
      r6?.verificationStatus === "unverified" && !r6?.verifiedAt,
      "6. Explicit unverified update -> downgrade and clear verifiedAt"
    );

    // 7. Explicit disputed update -> downgrade and clear verifiedAt
    const s7Name = `Case 7 Explicit Disputed Update ${Date.now()}`;
    const s7 = await Scheme.create({
      name: s7Name,
      description: "Scheme created verified to test disputed update",
      category: "Financial Assistance",
      level: "central",
      officialUrl: "https://financialservices.gov.in",
      source: "MoF",
      verificationStatus: "verified",
      verifiedAt: new Date("2026-02-01"),
      verifiedBy: "Audit Team",
    });
    testSchemeIds.push(s7._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s7Name,
            description: "Scheme created verified to test disputed update",
            category: "Financial Assistance",
            level: "central",
            officialUrl: "https://financialservices.gov.in",
            source: "MoF",
            verificationStatus: "disputed",
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r7 = await Scheme.findById(s7._id);
    assert(
      r7?.verificationStatus === "disputed" && !r7?.verifiedAt,
      "7. Explicit disputed update -> downgrade and clear verifiedAt"
    );

    // 8. Explicit needs-review update -> downgrade and clear verifiedAt
    const s8Name = `Case 8 Explicit Needs-Review Update ${Date.now()}`;
    const s8 = await Scheme.create({
      name: s8Name,
      description: "Scheme created verified to test needs-review update",
      category: "Women & Child",
      level: "central",
      officialUrl: "https://wcd.nic.in",
      source: "MoWCD",
      verificationStatus: "verified",
      verifiedAt: new Date("2026-02-01"),
      verifiedBy: "Audit Team",
    });
    testSchemeIds.push(s8._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s8Name,
            description: "Scheme created verified to test needs-review update",
            category: "Women & Child",
            level: "central",
            officialUrl: "https://wcd.nic.in",
            source: "MoWCD",
            verificationStatus: "needs-review",
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r8 = await Scheme.findById(s8._id);
    assert(
      r8?.verificationStatus === "needs-review" && !r8?.verifiedAt,
      "8. Explicit needs-review update -> downgrade and clear verifiedAt"
    );

    // 9. Omitted verification status -> preserve existing status and timestamp
    const s9InitialDate = new Date("2026-01-20T08:00:00.000Z");
    const s9Name = `Case 9 Omitted Verification Status ${Date.now()}`;
    const s9 = await Scheme.create({
      name: s9Name,
      description: "Original description before update with omitted verification status",
      category: "Entrepreneurship",
      level: "central",
      officialUrl: "https://startupindia.gov.in",
      source: "DPIIT",
      verificationStatus: "verified",
      verifiedAt: s9InitialDate,
      verifiedBy: "GovGuide Senior Audit Team",
    });
    testSchemeIds.push(s9._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s9Name,
            description: "Updated description while verificationStatus is omitted completely",
            category: "Entrepreneurship",
            level: "central",
            officialUrl: "https://startupindia.gov.in",
            source: "DPIIT",
            // verificationStatus OMITTED!
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r9 = await Scheme.findById(s9._id);
    assert(
      r9?.verificationStatus === "verified" &&
      r9?.verifiedAt?.getTime() === s9InitialDate.getTime() &&
      r9?.description === "Updated description while verificationStatus is omitted completely",
      "9. Omitted verification status -> preserve existing status and timestamp"
    );

    // 10. Missing reviewer identity -> fail safely
    const s10Name = `Case 10 Missing Reviewer Identity ${Date.now()}`;
    const s10 = await Scheme.create({
      name: s10Name,
      description: "Testing missing reviewer identity on candidate verified scheme",
      category: "Agriculture",
      level: "central",
      officialUrl: "https://agricoop.gov.in",
      source: "Ministry of Agriculture",
      verificationStatus: "unverified",
    });
    testSchemeIds.push(s10._id as mongoose.Types.ObjectId);

    await IngestionService.ingest(
      new JsonAdapter({
        jsonData: [
          {
            name: s10Name,
            description: "Candidate verified with provenance but missing reviewer identity",
            category: "Agriculture",
            level: "central",
            officialUrl: "https://agricoop.gov.in",
            source: "Ministry of Agriculture",
            sourceDocumentTitle: "Agriculture Operational Manual 2026",
            verificationStatus: "verified",
            verifiedBy: "  ", // Whitespace / empty string reviewer!
          },
        ],
      }),
      { allowUpdates: true }
    );
    const r10 = await Scheme.findById(s10._id);
    assert(
      r10?.verificationStatus === "needs-review" && !r10?.verifiedAt,
      "10. Missing reviewer identity -> fail safely (transitions to needs-review, verifiedAt cleared)"
    );
  } finally {
    // Targeted cleanup of test-created schemes exclusively by ID
    if (testSchemeIds.length > 0) {
      await cleanTestRecords({ schemeIds: testSchemeIds }, { Scheme });
      console.log(`  Cleaned up ${testSchemeIds.length} isolated test records.`);
    }
    await disconnectTestDB();
  }

  console.log("\n================================================================================");
  console.log(` PHASE B.5 REGRESSION SUMMARY: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runPhaseB5Tests().catch(async (err) => {
    console.error("Test execution failed with unhandled exception:", err);
    await disconnectTestDB();
    process.exit(1);
  });
}
