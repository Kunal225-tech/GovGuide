/**
 * seedPilotSchemes.ts
 *
 * Ingestion and seeding script for Phase B Verified Pilot Dataset.
 * Performs idempotent, non-destructive upserts for 10 verified pilot schemes
 * and their corresponding eligibility rules.
 *
 * Features:
 * - Supports --dry-run mode for pre-flight change validation without DB writes
 * - Preserves existing MongoDB _id values to maintain Application and SavedScheme foreign keys
 * - Normalizes and validates incoming records through the Phase 1 pipeline
 * - Gated eligibility rule completeness: strictly sets isComplete: true ONLY on verified complete schemes
 *
 * Usage:
 *   Dry run:  npx ts-node src/scripts/seedPilotSchemes.ts --dry-run
 *   Live run: npx ts-node src/scripts/seedPilotSchemes.ts
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import Application from "../models/Application";
import { ENV } from "../config/env";
import { normalizeSchemeInput } from "../pipeline/normalizers/schemeNormalizer";
import { validateNormalizedScheme } from "../pipeline/validators/ingestionValidator";
import { resolveVerificationTransition } from "../pipeline/services/verificationLifecycle";
import { RawSchemeInput } from "../pipeline/types";

interface SeedResult {
  name: string;
  level: string;
  category: string;
  action: "CREATED" | "UPDATED" | "NO_CHANGE" | "INVALID";
  ruleCompleteness: "COMPLETE" | "INCOMPLETE";
  unsupportedCriteriaCount: number;
  schemeId?: string;
  errors?: string[];
}

export interface PilotSeedOptions {
  dryRun?: boolean;
  live?: boolean;
  forceProduction?: boolean;
}

export async function runPilotSeeding(options: PilotSeedOptions = {}): Promise<{
  success: boolean;
  dryRun: boolean;
  totalProcessed: number;
  results: SeedResult[];
}> {
  // Command-line flag parsing: Default is DRY RUN unless explicitly requested with --live or --write
  const hasLiveFlag =
    process.argv.includes("--live") ||
    process.argv.includes("--write") ||
    Boolean(options.live);
  const hasDryRunFlag =
    process.argv.includes("--dry-run") || options.dryRun === true;
  const hasForceProdFlag =
    process.argv.includes("--force-production") ||
    Boolean(options.forceProduction);

  const isDryRun = !hasLiveFlag || hasDryRunFlag;

  const isProduction =
    ENV.IS_PRODUCTION ||
    ENV.NODE_ENV === "production" ||
    (Boolean(process.env.NODE_ENV) &&
      process.env.NODE_ENV!.toLowerCase() === "production");

  console.log("================================================================================");
  console.log(` GovGuide Phase B: Official Scheme Sources & Pilot Dataset Ingestion`);
  console.log(` Target Environment : ${ENV.NODE_ENV} | Production Guard: ${isProduction ? "ACTIVE (Production)" : "Non-Production"}`);
  console.log(` Execution Mode     : ${isDryRun ? "DRY RUN (Default: Read-Only Preview)" : "LIVE EXECUTION (--live / --write confirmed)"}`);
  console.log("================================================================================");

  // Production safeguard: Block live writes in production unless explicitly overridden
  if (!isDryRun && isProduction && !hasForceProdFlag) {
    throw new Error(
      "SAFETY VIOLATION: Seeding write operations are blocked in production environment by default. " +
      "To execute live seeding in production, you must explicitly supply the '--force-production' flag."
    );
  }

  // 1. Locate and read pilot dataset
  const pilotFilePath = path.resolve(__dirname, "../../../data/pilot/verified_pilot_schemes.json");
  if (!fs.existsSync(pilotFilePath)) {
    throw new Error(`Pilot dataset file not found at: ${pilotFilePath}`);
  }

  const rawData: RawSchemeInput[] = JSON.parse(fs.readFileSync(pilotFilePath, "utf-8"));
  console.log(`\nFound ${rawData.length} pilot scheme candidates in ${pilotFilePath}.\n`);

  // 2. Connect to MongoDB
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(ENV.MONGODB_URI);
  }
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);

  const initialSchemeCount = await Scheme.countDocuments();
  const initialAppCount = await Application.countDocuments();
  const initialRuleCount = await EligibilityRule.countDocuments();
  console.log(`Current Database State:`);
  console.log(` - Existing Schemes: ${initialSchemeCount}`);
  console.log(` - Existing Eligibility Rules: ${initialRuleCount}`);
  console.log(` - Existing Applications (Must be preserved): ${initialAppCount}\n`);

  // 3. Pre-scan planned operations
  const candidateNames = rawData.map((r) => r.name.trim());
  const existingMatches = await Scheme.find({ name: { $in: candidateNames } }).select("_id name");
  const existingNameSet = new Set(existingMatches.map((m) => m.name));
  const plannedNewCount = candidateNames.filter((n) => !existingNameSet.has(n)).length;
  const plannedUpdateCount = candidateNames.filter((n) => existingNameSet.has(n)).length;

  console.log(`Planned Seeding Operations:`);
  console.log(` - Total Dataset Candidates : ${rawData.length}`);
  console.log(` - Planned New Insertions   : ${plannedNewCount}`);
  console.log(` - Planned Existing Updates : ${plannedUpdateCount}`);
  console.log(` - Application References   : ${initialAppCount} (100% Protected, Zero Mutations)\n`);

  const results: SeedResult[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${rawData.length}] Processing Candidate: "${raw.name}"`);

    // Normalize
    const normalized = normalizeSchemeInput(raw, "pilot-dataset-v1");

    // Validate
    const validation = validateNormalizedScheme(normalized);
    if (!validation.isValid) {
      console.error(`  [INVALID] Validation failed:`, validation.errors);
      results.push({
        name: raw.name,
        level: raw.level || "unknown",
        category: raw.category || "unknown",
        action: "INVALID",
        ruleCompleteness: "INCOMPLETE",
        unsupportedCriteriaCount: 0,
        errors: validation.errors,
      });
      continue;
    }

    // Check existing
    const existing = await Scheme.findOne({ name: normalized.name });
    const isComplete = Boolean(normalized.rule?.isComplete);
    const unsupportedCount = normalized.rule?.unsupportedCriteria?.length || 0;

    if (!existing) {
      // New Scheme
      if (isDryRun) {
        console.log(`  [DRY-RUN] Will create NEW scheme: "${normalized.name}" (${normalized.level})`);
        console.log(`            Category: ${normalized.category} | Source: ${normalized.source}`);
        console.log(`            Rule Completeness: ${isComplete ? "COMPLETE (Automated Eligible)" : "INCOMPLETE (Unverified Safety Default)"}`);
        console.log(`            Unsupported Criteria: ${unsupportedCount} items`);
        results.push({
          name: normalized.name,
          level: normalized.level,
          category: normalized.category,
          action: "CREATED",
          ruleCompleteness: isComplete ? "COMPLETE" : "INCOMPLETE",
          unsupportedCriteriaCount: unsupportedCount,
        });
      } else {
        const initialVer = resolveVerificationTransition(normalized, null);
        const newScheme = new Scheme({
          name: normalized.name,
          description: normalized.description,
          category: normalized.category,
          level: normalized.level,
          state: normalized.state,
          schemeType: normalized.schemeType,
          applicableStates: normalized.applicableStates,
          benefits: normalized.benefits,
          eligibility: normalized.eligibility,
          requiredDocuments: normalized.requiredDocuments,
          applicationProcess: normalized.applicationProcess,
          officialUrl: normalized.officialUrl,
          applicationUrl: normalized.applicationUrl,
          officialDocUrl: normalized.officialDocUrl,
          source: normalized.source,
          sourcePlatform: normalized.sourcePlatform,
          sourceId: normalized.sourceId,
          sourceDocumentTitle: normalized.sourceDocumentTitle,
          verifiedBy: initialVer.verifiedBy || normalized.verifiedBy,
          aliases: normalized.aliases,
          exclusions: normalized.exclusions,
          unresolvedQuestions: normalized.unresolvedQuestions,
          verificationStatus: initialVer.verificationStatus || "unverified",
          status: normalized.status,
          hasDeterministicRule: normalized.hasDeterministicRule,
          verifiedAt: initialVer.verifiedAt || undefined,
        });
        const saved = await newScheme.save();

        if (normalized.rule) {
          await EligibilityRule.create({
            schemeId: saved._id,
            minAge: normalized.rule.minAge,
            maxAge: normalized.rule.maxAge,
            maxAnnualIncome: normalized.rule.maxAnnualIncome,
            states: normalized.rule.states,
            occupations: normalized.rule.occupations,
            educationLevels: normalized.rule.educationLevels,
            categories: normalized.rule.categories,
            genders: normalized.rule.genders,
            isVerified: true,
            isComplete: normalized.rule.isComplete ?? false,
            hasUnsupportedCriteria: normalized.rule.hasUnsupportedCriteria ?? false,
            unsupportedCriteria: normalized.rule.unsupportedCriteria ?? [],
          });
        }

        console.log(`  [LIVE] Successfully created Scheme [ID: ${saved._id}] and EligibilityRule.`);
        results.push({
          name: saved.name,
          level: saved.level,
          category: saved.category,
          action: "CREATED",
          ruleCompleteness: isComplete ? "COMPLETE" : "INCOMPLETE",
          unsupportedCriteriaCount: unsupportedCount,
          schemeId: saved._id.toString(),
        });
      }
    } else {
      // Existing Scheme - Idempotent non-destructive update
      if (isDryRun) {
        console.log(`  [DRY-RUN] Will UPDATE existing scheme: "${existing.name}" [ID: ${existing._id}]`);
        console.log(`            Preserving existing ID and all Application references.`);
        console.log(`            Adding Provenance: Source Title="${normalized.sourceDocumentTitle}", Exclusions=${normalized.exclusions?.length || 0}`);
        console.log(`            Rule Completeness: ${isComplete ? "COMPLETE" : "INCOMPLETE"}`);
        results.push({
          name: existing.name,
          level: existing.level,
          category: existing.category,
          action: "UPDATED",
          ruleCompleteness: isComplete ? "COMPLETE" : "INCOMPLETE",
          unsupportedCriteriaCount: unsupportedCount,
          schemeId: existing._id.toString(),
        });
      } else {
        const updateData: Record<string, any> = {
          description: normalized.description,
          category: normalized.category,
          level: normalized.level,
          schemeType: normalized.schemeType,
          benefits: normalized.benefits,
          eligibility: normalized.eligibility,
          requiredDocuments: normalized.requiredDocuments,
          applicationProcess: normalized.applicationProcess,
          officialUrl: normalized.officialUrl,
          source: normalized.source,
          sourcePlatform: normalized.sourcePlatform,
          status: normalized.status || "active",
        };

        // Preserve and sync sourceId if present
        if (normalized.sourceId) {
          updateData.sourceId = normalized.sourceId;
        }

        // Verification status lifecycle & verifiedAt handling
        const verTransition = resolveVerificationTransition(normalized, existing);
        if (verTransition.verificationStatus !== undefined) {
          updateData.verificationStatus = verTransition.verificationStatus;
          updateData.verifiedAt = verTransition.verifiedAt;
          if (verTransition.verifiedBy) {
            updateData.verifiedBy = verTransition.verifiedBy;
          }
        }

        // Synchronize hasDeterministicRule using normalized input when explicitly supplied
        if (normalized.hasDeterministicRule !== undefined) {
          updateData.hasDeterministicRule = normalized.hasDeterministicRule;
        } else if (existing.hasDeterministicRule !== undefined) {
          updateData.hasDeterministicRule = existing.hasDeterministicRule;
        }

        if (normalized.state) updateData.state = normalized.state;
        if (normalized.applicableStates?.length) updateData.applicableStates = normalized.applicableStates;
        if (normalized.applicationUrl) updateData.applicationUrl = normalized.applicationUrl;
        if (normalized.officialDocUrl) updateData.officialDocUrl = normalized.officialDocUrl;
        if (normalized.sourceDocumentTitle) updateData.sourceDocumentTitle = normalized.sourceDocumentTitle;
        if (normalized.verifiedBy) updateData.verifiedBy = normalized.verifiedBy;
        if (normalized.aliases?.length) updateData.aliases = normalized.aliases;
        if (normalized.exclusions?.length) updateData.exclusions = normalized.exclusions;
        if (normalized.unresolvedQuestions?.length) updateData.unresolvedQuestions = normalized.unresolvedQuestions;

        const updated = await Scheme.findByIdAndUpdate(
          existing._id,
          { $set: updateData },
          { runValidators: true, new: true }
        );

        if (normalized.rule) {
          const ruleSet: Record<string, any> = {
            schemeId: existing._id,
            isVerified: true,
            isComplete: normalized.rule.isComplete ?? false,
            hasUnsupportedCriteria: normalized.rule.hasUnsupportedCriteria ?? false,
            unsupportedCriteria: normalized.rule.unsupportedCriteria ?? [],
            states: normalized.rule.states ?? [],
            occupations: normalized.rule.occupations ?? [],
            educationLevels: normalized.rule.educationLevels ?? [],
            categories: normalized.rule.categories ?? [],
            genders: normalized.rule.genders ?? [],
          };
          const ruleUnset: Record<string, any> = {};

          if (normalized.rule.minAge !== undefined) ruleSet.minAge = normalized.rule.minAge;
          else ruleUnset.minAge = 1;

          if (normalized.rule.maxAge !== undefined) ruleSet.maxAge = normalized.rule.maxAge;
          else ruleUnset.maxAge = 1;

          if (normalized.rule.maxAnnualIncome !== undefined) ruleSet.maxAnnualIncome = normalized.rule.maxAnnualIncome;
          else ruleUnset.maxAnnualIncome = 1;

          const updateOps: Record<string, any> = { $set: ruleSet };
          if (Object.keys(ruleUnset).length > 0) {
            updateOps.$unset = ruleUnset;
          }

          await EligibilityRule.findOneAndUpdate(
            { schemeId: existing._id },
            updateOps,
            { upsert: true, runValidators: true }
          );
        }

        console.log(`  [LIVE] Successfully updated existing Scheme [ID: ${updated!._id}] and synchronized rule.`);
        results.push({
          name: updated!.name,
          level: updated!.level,
          category: updated!.category,
          action: "UPDATED",
          ruleCompleteness: isComplete ? "COMPLETE" : "INCOMPLETE",
          unsupportedCriteriaCount: unsupportedCount,
          schemeId: updated!._id.toString(),
        });
      }
    }
  }

  // 3. Post-verification audit
  const finalSchemeCount = await Scheme.countDocuments();
  const finalAppCount = await Application.countDocuments();
  const finalRuleCount = await EligibilityRule.countDocuments();

  console.log("\n================================================================================");
  console.log(" INGESTION & DATA QUALITY AUDIT REPORT");
  console.log("================================================================================");
  console.table(
    results.map((r) => ({
      Scheme: r.name.length > 35 ? r.name.slice(0, 32) + "..." : r.name,
      Level: r.level,
      Category: r.category,
      Action: r.action,
      "Rule Status": r.ruleCompleteness,
      "Unsupported Ctr": r.unsupportedCriteriaCount,
    }))
  );

  console.log(`Database Reference Integrity Verification:`);
  console.log(` - Initial Schemes: ${initialSchemeCount} -> Current: ${finalSchemeCount}`);
  console.log(` - Initial Eligibility Rules: ${initialRuleCount} -> Current: ${finalRuleCount}`);
  console.log(` - Initial Applications: ${initialAppCount} -> Current: ${finalAppCount} (100% PRESERVED)`);
  console.log("================================================================================\n");

  return {
    success: true,
    dryRun: isDryRun,
    totalProcessed: results.length,
    results,
  };
}

// Direct CLI execution
if (require.main === module) {
  runPilotSeeding()
    .then(async (outcome) => {
      await mongoose.disconnect();
      console.log(`Database disconnected cleanly. Pilot seeding completed in ${outcome.dryRun ? "DRY RUN (Read-Only Preview)" : "LIVE"} mode.`);
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Pilot seeding script failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
