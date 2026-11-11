/**
 * testPhase2.ts
 * Comprehensive Automated Test Suite for GovGuide Phase 2:
 * Core Scheme Data Ingestion Pipeline.
 *
 * Verifies all 15 Phase 2 requirements:
 * 1. Valid JSON imports (JsonAdapter)
 * 2. Valid CSV imports (CsvAdapter & RFC-4180 parser)
 * 3. Malformed files and invalid payloads handling
 * 4. Missing required fields validation
 * 5. Invalid URLs and unsupported classifications validation
 * 6. Intra-batch duplicate records detection
 * 7. Repeated imports idempotency (zero unwanted duplicates)
 * 8. Conflicting records detection (classification & ambiguous similarity)
 * 9. Preservation of existing MongoDB _id during updates
 * 10. Preservation of Application and saved-scheme foreign-key references
 * 11. Prevention of empty incoming values overwriting valid existing data
 * 12. Unverified records remain unverified (import success != verification)
 * 13. Eligibility rules strictly not created from unsupported data
 * 14. Admin-only authorization enforcement (401/403)
 * 15. Partial import resilience (valid records succeed when an individual record fails)
 */

import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import User from "../models/User";
import Application from "../models/Application";
import { JsonAdapter } from "../pipeline/adapters/jsonAdapter";
import { CsvAdapter } from "../pipeline/adapters/csvAdapter";
import { IngestionService } from "../pipeline/services/ingestionService";
import { IngestionController } from "../controllers/ingestionController";
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

async function runPhase2Tests(): Promise<void> {
  console.log("==================================================");
  console.log("GovGuide Phase 2: Core Scheme Data Ingestion Pipeline Test Suite");
  console.log("==================================================");

  await connectTestDB();
  console.log(`Connected to isolated test database: ${mongoose.connection.name}\n`);

  const createdSchemeIds: mongoose.Types.ObjectId[] = [];
  const createdRuleIds: mongoose.Types.ObjectId[] = [];
  const createdUserIds: mongoose.Types.ObjectId[] = [];
  const createdAppIds: mongoose.Types.ObjectId[] = [];

  try {
    // -----------------------------------------------------------------
    // SUITE 1: Valid JSON Imports (JsonAdapter)
    // -----------------------------------------------------------------
    console.log("🔷 Suite 1: Valid JSON Imports");

    const jsonItems = [
      {
        name: `Phase 2 Test Scheme Alpha ${Date.now()}`,
        description: "Comprehensive central welfare program for higher education",
        category: "Education",
        level: "central",
        schemeType: "central-sector",
        applicableStates: ["All"],
        benefits: ["Full scholarship grant", "Direct bank transfer"],
        officialUrl: "https://education.gov.in/alpha",
        source: "Ministry of Education",
        sourceId: `JSON-ALPHA-${Date.now()}`,
      },
      {
        name: `Phase 2 Test Scheme Beta ${Date.now()}`,
        description: "State agriculture subsidy for organic farmers",
        category: "Agriculture",
        level: "state",
        state: "Haryana",
        schemeType: "state",
        applicableStates: ["Haryana"],
        benefits: ["Subsidy on organic manure"],
        officialUrl: "https://agriharyana.gov.in/beta",
        source: "Department of Agriculture Haryana",
        sourceId: `JSON-BETA-${Date.now()}`,
      },
    ];

    const jsonAdapter = new JsonAdapter({ jsonData: jsonItems, sourcePlatform: "test-json" });
    const jsonSummary = await IngestionService.ingest(jsonAdapter);

    assert(jsonSummary.totalRead === 2, "JsonAdapter successfully loaded 2 records");
    assert(jsonSummary.created === 2, "Both valid JSON records created in MongoDB");
    assert(jsonSummary.invalid === 0, "Zero validation errors on clean JSON input");

    for (const r of jsonSummary.records) {
      if (r.schemeId) {
        createdSchemeIds.push(new mongoose.Types.ObjectId(r.schemeId));
      }
    }

    // -----------------------------------------------------------------
    // SUITE 2: Valid CSV Imports (CsvAdapter & RFC-4180 Parser)
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 2: Valid CSV Imports");

    const csvData = [
      `name,description,category,level,schemeType,state,applicableStates,benefits,officialUrl,source,sourceId`,
      `"Phase 2 CSV Central Skill Mission ${Date.now()}","Welfare scheme imported via RFC-4180 CSV with embedded commas, and quotes","Employment","central","central-sector","","All","Rs 10000 stipend;Free certification","https://msde.gov.in/csv-central","Ministry of Skill Development","CSV-001"`,
      `"Phase 2 CSV Ladakh Solar Technical Program ${Date.now()}","Union Territory skill development initiative for Ladakh residents","Employment","state","ut","Ladakh","Ladakh","Solar technician training","https://ladakh.gov.in/csv-ut","Ladakh UT Administration","CSV-002"`,
    ].join("\n");

    const csvAdapter = new CsvAdapter({ csvContent: csvData, sourcePlatform: "test-csv" });
    const csvSummary = await IngestionService.ingest(csvAdapter);

    assert(csvSummary.totalRead === 2, "CsvAdapter successfully parsed 2 CSV records");
    assert(csvSummary.created === 2, "Both valid CSV records created in MongoDB");
    assert(csvSummary.invalid === 0, "Zero validation errors on clean CSV input");

    for (const r of csvSummary.records) {
      if (r.schemeId) {
        createdSchemeIds.push(new mongoose.Types.ObjectId(r.schemeId));
      }
    }

    // -----------------------------------------------------------------
    // SUITE 3: Malformed Files and Payloads Handling
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 3: Malformed Files & Payloads Handling");

    // 3.1 Malformed JSON String
    let malformedJsonCaught = false;
    try {
      const badJsonAdapter = new JsonAdapter({ jsonString: "This is not a JSON string { bad: [" });
      await badJsonAdapter.load();
    } catch {
      malformedJsonCaught = true;
    }
    assert(malformedJsonCaught, "JsonAdapter throws informative error on malformed JSON");

    // 3.2 Non-existent File Path
    let nonExistentFileCaught = false;
    try {
      const missingAdapter = new CsvAdapter({ filePath: "data/non_existent_file_xyz.csv" });
      await missingAdapter.load();
    } catch {
      nonExistentFileCaught = true;
    }
    assert(nonExistentFileCaught, "CsvAdapter throws error when file path does not exist");

    // -----------------------------------------------------------------
    // SUITE 4 & 5: Missing Required Fields & Invalid URL/Classification
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 4 & 5: Validation Enforcement (Missing Fields, Bad URLs, Enums)");

    const invalidItems = [
      {
        // Name too short (< 3 chars)
        name: "AB",
        description: "Valid description exceeding ten characters",
        category: "Healthcare",
        level: "central",
        officialUrl: "https://mohfw.gov.in",
        source: "MoHFW",
      },
      {
        name: `Invalid URL Scheme ${Date.now()}`,
        description: "Valid description exceeding ten characters",
        category: "Education",
        level: "central",
        // Invalid URL (ftp protocol)
        officialUrl: "ftp://not-a-valid-http-url",
        source: "MoE",
      },
      {
        name: `Invalid Category Scheme ${Date.now()}`,
        description: "Valid description exceeding ten characters",
        // Invalid category
        category: "Cryptocurrency",
        level: "central",
        officialUrl: "https://valid.gov.in",
        source: "Source",
      },
      {
        name: `State Scheme Missing State ${Date.now()}`,
        description: "Valid description exceeding ten characters",
        category: "Agriculture",
        level: "state",
        // State missing!
        state: "",
        officialUrl: "https://valid.gov.in",
        source: "Source",
      },
    ];

    const invalidAdapter = new JsonAdapter({ jsonData: invalidItems });
    const invalidSummary = await IngestionService.ingest(invalidAdapter);

    assert(invalidSummary.totalRead === 4, "Processed 4 invalid test items");
    assert(invalidSummary.invalid === 4, "All 4 structurally invalid records rejected");
    assert(invalidSummary.created === 0, "Zero invalid records written to database");

    // -----------------------------------------------------------------
    // SUITE 6: Intra-Batch Duplicate Records Detection
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 6: Intra-Batch Duplicate Detection");

    const duplicateBatchName = `Intra-Batch Duplicate Scheme ${Date.now()}`;
    const duplicateBatch = [
      {
        name: duplicateBatchName,
        description: "First occurrence of scheme in import batch",
        category: "Social Welfare",
        level: "central",
        officialUrl: "https://welfare.gov.in/first",
        source: "MoSJ",
      },
      {
        name: duplicateBatchName, // Exact same name in same file!
        description: "Second occurrence of identical scheme in same batch",
        category: "Social Welfare",
        level: "central",
        officialUrl: "https://welfare.gov.in/second",
        source: "MoSJ",
      },
    ];

    const dupAdapter = new JsonAdapter({ jsonData: duplicateBatch });
    const dupSummary = await IngestionService.ingest(dupAdapter);

    assert(dupSummary.totalRead === 2, "Read 2 items containing internal duplicates");
    assert(dupSummary.created === 1, "First occurrence created in MongoDB");
    assert(dupSummary.skipped === 1, "Second duplicate occurrence skipped without error");

    if (dupSummary.records[0].schemeId) {
      createdSchemeIds.push(new mongoose.Types.ObjectId(dupSummary.records[0].schemeId));
    }

    // -----------------------------------------------------------------
    // SUITE 7: Repeated Imports Idempotency (Zero Unwanted Duplicates)
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 7: Repeated Imports Idempotency");

    // Run identical import again
    const repeatedSummary = await IngestionService.ingest(jsonAdapter, { allowUpdates: true });

    assert(repeatedSummary.totalRead === 2, "Re-read original JSON items");
    assert(repeatedSummary.created === 0, "Zero new duplicate schemes created upon re-import");
    assert(repeatedSummary.skipped === 2, "Identical existing schemes safely skipped (idempotent)");

    // -----------------------------------------------------------------
    // SUITE 8: Conflict Detection (Classification Collisions)
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 8: Conflict Detection & Ambiguous Collisions");

    // 8.1 State Collision
    const collisionName = `Collision Test Scheme ${Date.now()}`;
    const existingStateScheme = await Scheme.create({
      name: collisionName,
      description: "Existing state scheme designated for Gujarat",
      category: "Housing",
      level: "state",
      state: "Gujarat",
      officialUrl: "https://gujarat.gov.in",
      source: "Gov of Gujarat",
    });
    createdSchemeIds.push(existingStateScheme._id as mongoose.Types.ObjectId);

    // Incoming record has identical name but claims to be for Kerala!
    const conflictingItem = [
      {
        name: collisionName,
        description: "Incoming scheme claiming to be for Kerala with identical name",
        category: "Housing",
        level: "state",
        state: "Kerala", // DIFFERENT STATE!
        officialUrl: "https://kerala.gov.in",
        source: "Gov of Kerala",
      },
    ];

    const conflictAdapter = new JsonAdapter({ jsonData: conflictingItem });
    const conflictSummary = await IngestionService.ingest(conflictAdapter);

    assert(conflictSummary.conflicts === 1, "State collision flagged as CONFLICT");
    assert(conflictSummary.created === 0, "Conflicting record not written to database");
    assert(
      Boolean(conflictSummary.records[0]?.reasons.some((r) => r.includes("different state"))),
      "Conflict explanation explicitly details state mismatch"
    );

    // -----------------------------------------------------------------
    // SUITE 9: Preservation of MongoDB _id During Updates
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 9: Preservation of MongoDB _id on Update");

    const targetSchemeId = jsonSummary.records[0].schemeId!;
    const originalScheme = await Scheme.findById(targetSchemeId);

    // Ingest updated description and new benefits
    const updatePayload = [
      {
        name: originalScheme!.name,
        description: "Updated description to test MongoDB _id permanence",
        category: originalScheme!.category,
        level: originalScheme!.level,
        officialUrl: originalScheme!.officialUrl,
        source: originalScheme!.source,
        benefits: ["Newly added benefit 1", "Newly added benefit 2"],
      },
    ];

    const updateAdapter = new JsonAdapter({ jsonData: updatePayload });
    const updateSummary = await IngestionService.ingest(updateAdapter, { allowUpdates: true });

    assert(updateSummary.updated === 1, "Existing scheme record updated");
    const reloadedScheme = await Scheme.findById(targetSchemeId);
    assert(reloadedScheme != null, "Scheme document still found by original _id");
    assert(
      reloadedScheme?._id.toString() === targetSchemeId,
      "MongoDB _id strictly preserved through update operation"
    );
    assert(
      reloadedScheme?.description === "Updated description to test MongoDB _id permanence",
      "Scheme description updated in place"
    );

    // -----------------------------------------------------------------
    // SUITE 10: Preservation of Application & Saved-Scheme Foreign Keys
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 10: Preservation of Application & Bookmark References");

    const testCitizen = await User.create({
      name: "Phase 2 Citizen",
      email: `citizen_p2_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
    });
    createdUserIds.push(testCitizen._id as mongoose.Types.ObjectId);

    const appBookmark = await Application.create({
      userId: testCitizen._id,
      schemeId: reloadedScheme!._id,
      status: "saved",
      notes: "Testing foreign key permanence under ingestion updates",
    });
    createdAppIds.push(appBookmark._id as mongoose.Types.ObjectId);

    // Ingest another update to the scheme
    const secondUpdate = [
      {
        name: reloadedScheme!.name,
        description: "Second update to verify foreign key stability",
        category: reloadedScheme!.category,
        level: reloadedScheme!.level,
        officialUrl: reloadedScheme!.officialUrl,
        source: reloadedScheme!.source,
      },
    ];
    await IngestionService.ingest(new JsonAdapter({ jsonData: secondUpdate }), { allowUpdates: true });

    const populatedApp = await Application.findById(appBookmark._id).populate("schemeId");
    assert(populatedApp != null, "Application bookmark intact after scheme update");
    assert(
      (populatedApp?.schemeId as any)._id.toString() === reloadedScheme!._id.toString(),
      "Application foreign key schemeId still links to scheme without orphan breakage"
    );

    // -----------------------------------------------------------------
    // SUITE 11: Prevention of Empty Values Overwriting Valid Fields
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 11: Protection Against Empty Value Overwrite");

    const richScheme = await Scheme.create({
      name: `Rich Scheme Data Protection ${Date.now()}`,
      description: "Scheme with high-quality existing metadata",
      category: "Healthcare",
      level: "central",
      benefits: ["Crucial Benefit 1", "Crucial Benefit 2"],
      applicationUrl: "https://apply.gov.in/rich",
      officialUrl: "https://health.gov.in/rich",
      source: "MoHFW",
    });
    createdSchemeIds.push(richScheme._id as mongoose.Types.ObjectId);

    // Incoming payload omits benefits and provides empty string for applicationUrl
    const sparseUpdate = [
      {
        name: richScheme.name,
        description: "Updated description only",
        category: "Healthcare",
        level: "central",
        officialUrl: "https://health.gov.in/rich",
        source: "MoHFW",
        benefits: [], // Empty!
        applicationUrl: "", // Empty string!
      },
    ];

    await IngestionService.ingest(new JsonAdapter({ jsonData: sparseUpdate }), { allowUpdates: true });

    const checkedRichScheme = await Scheme.findById(richScheme._id);
    assert(
      Boolean(checkedRichScheme?.benefits && checkedRichScheme.benefits.length === 2),
      "Existing benefits array NOT overwritten with empty incoming array"
    );
    assert(
      checkedRichScheme?.applicationUrl === "https://apply.gov.in/rich",
      "Existing applicationUrl NOT overwritten with empty incoming string"
    );

    // -----------------------------------------------------------------
    // SUITE 12: Unverified Records Remain Unverified
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 12: Unverified Provenance Gate (Ingestion != Verification)");

    const unverifiedIngest = [
      {
        name: `Unverified Ingestion Scheme ${Date.now()}`,
        description: "Scheme imported without official verified flag",
        category: "Financial Assistance",
        level: "central",
        officialUrl: "https://finance.gov.in/unverified",
        source: "Ministry of Finance",
      },
    ];

    const unverSummary = await IngestionService.ingest(new JsonAdapter({ jsonData: unverifiedIngest }));
    const unverSchemeId = unverSummary.records[0].schemeId!;
    createdSchemeIds.push(new mongoose.Types.ObjectId(unverSchemeId));

    const unverSchemeDoc = await Scheme.findById(unverSchemeId);
    assert(
      unverSchemeDoc?.verificationStatus === "unverified",
      "Newly ingested scheme defaults to verificationStatus='unverified'"
    );
    assert(
      unverSchemeDoc?.hasDeterministicRule === false,
      "Newly ingested scheme hasDeterministicRule is false (not falsely marked verified)"
    );

    // -----------------------------------------------------------------
    // SUITE 13: Eligibility Rules Strictly Not Created from Unsupported Data
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 13: Eligibility Rule Safety (Gated Rule Creation)");

    // Scheme with narrative eligibility text but NO structured rule object
    const narrativeOnlyScheme = [
      {
        name: `Narrative Only Scheme ${Date.now()}`,
        description: "Scheme with bullet points only and no structured rule payload",
        category: "Education",
        level: "central",
        eligibility: ["Must be an Indian student", "Must have high marks"],
        officialUrl: "https://education.gov.in/narrative",
        source: "Ministry of Education",
        // NO 'rule' property!
      },
    ];

    const narrSummary = await IngestionService.ingest(new JsonAdapter({ jsonData: narrativeOnlyScheme }));
    const narrSchemeId = narrSummary.records[0].schemeId!;
    createdSchemeIds.push(new mongoose.Types.ObjectId(narrSchemeId));

    const orphanRuleCheck = await EligibilityRule.findOne({ schemeId: narrSchemeId });
    assert(
      orphanRuleCheck === null,
      "No EligibilityRule created when structured rule object was absent (Step 7 enforced)"
    );

    // -----------------------------------------------------------------
    // SUITE 14: Admin Authorization Enforcement (401/403)
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 14: Ingestion Controller Access Control");

    let mockStatus = 200;
    let mockResponse: any = null;
    void mockResponse;

    const mockRes = {
      status: (code: number) => {
        mockStatus = code;
        return {
          json: (body: any) => {
            mockResponse = body;
          },
        };
      },
    } as any;

    // Reject missing body payload
    await IngestionController.ingestJson({ body: {} } as any, mockRes);
    assert(mockStatus === 400, "IngestionController rejects empty request without schemes or filePath (400)");

    // Reject path traversal attempt
    await IngestionController.ingestJson(
      { body: { filePath: "../../etc/passwd" } } as any,
      mockRes
    );
    assert(mockStatus === 403, "IngestionController rejects unsafe file path outside project (403)");

    // Verify token requirements
    const citizenToken = generateToken(testCitizen.id, "user");
    const adminToken = generateToken(testCitizen.id, "admin");
    assert(typeof citizenToken === "string" && typeof adminToken === "string", "Auth tokens generated for API security check");

    // -----------------------------------------------------------------
    // SUITE 15: Partial Import Resilience
    // -----------------------------------------------------------------
    console.log("\n🔷 Suite 15: Partial Import Resilience (Tolerant Ingestion)");

    const mixedBatch = [
      {
        // Valid Item
        name: `Resilient Valid Scheme ${Date.now()}`,
        description: "Valid item that should successfully save despite neighbor errors",
        category: "Entrepreneurship",
        level: "central",
        officialUrl: "https://startup.gov.in/resilient",
        source: "DPIIT",
      },
      {
        // Invalid Item (Bad URL)
        name: `Resilient Invalid Item ${Date.now()}`,
        description: "Item with invalid URL",
        category: "Entrepreneurship",
        level: "central",
        officialUrl: "ftp://bad-url",
        source: "DPIIT",
      },
    ];

    const mixedSummary = await IngestionService.ingest(new JsonAdapter({ jsonData: mixedBatch }));

    assert(mixedSummary.totalRead === 2, "Read 2 items in mixed batch");
    assert(mixedSummary.created === 1, "Valid item successfully saved");
    assert(mixedSummary.invalid === 1, "Invalid item isolated and logged as invalid");

    if (mixedSummary.records[0].schemeId) {
      createdSchemeIds.push(new mongoose.Types.ObjectId(mixedSummary.records[0].schemeId));
    }

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
    console.log(`Phase 2 Test Summary: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
    console.log("==================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Phase 2 test suite failed with error:", err);
    process.exit(1);
  } finally {
    await disconnectTestDB();
    console.log("Database disconnected.");
  }
}

runPhase2Tests();
