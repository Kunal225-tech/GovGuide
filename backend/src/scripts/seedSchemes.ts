/**
 * seedSchemes.ts
 * Populates MongoDB strictly with verified Bihar State and Bihar-applicable Central
 * welfare schemes from data/bihar/all_bihar_schemes.json, and safely removes any
 * non-Bihar state schemes or legacy duplicate entries while preserving user references.
 *
 * Usage:
 *   Dry run:  npx ts-node src/scripts/seedSchemes.ts --dry-run
 *   Live run: npx ts-node src/scripts/seedSchemes.ts
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Scheme, { SchemeType, VerificationStatus, SchemeStatus } from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import Application from "../models/Application";
import { ENV } from "../config/env";

interface BiharDatasetRule {
  minAge?: number;
  maxAge?: number;
  maxAnnualIncome?: number;
  states?: string[];
  occupations?: string[];
  educationLevels?: string[];
  categories?: string[];
  categoryExemptGenders?: string[];
  genders?: string[];
  isVerified?: boolean;
  isComplete?: boolean;
  hasUnsupportedCriteria?: boolean;
  unsupportedCriteria?: string[];
}

interface BiharDatasetScheme {
  name: string;
  aliases?: string[];
  category: string;
  level: "central" | "state";
  state?: string;
  applicableStates?: string[];
  schemeType?: SchemeType;
  description: string;
  benefits: string[];
  eligibility: string[];
  exclusions?: string[];
  requiredDocuments?: string[];
  applicationProcess?: string[];
  officialUrl: string;
  applicationUrl?: string;
  source: string;
  sourcePlatform?: string;
  status?: SchemeStatus;
  hasDeterministicRule?: boolean;
  rule?: BiharDatasetRule;
}

/**
 * Maps legacy / duplicate scheme names from earlier seeds to canonical Bihar dataset names
 * so saved schemes and application trackers migrate cleanly without breaking user history.
 */
const LEGACY_DUPLICATE_MAP: Record<string, string> = {
  "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)": "PM Kisan Samman Nidhi",
  "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)": "Pradhan Mantri Awas Yojana - Gramin",
  "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)":
    "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
  "Pradhan Mantri MUDRA Yojana (PMMY)": "Pradhan Mantri Mudra Yojana (PMMY)",
  "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)": "PM SVANidhi",
  "Mukhyamantri Civil Seva Protsahan Yojana - BPSC": "BPSC Civil Seva Protsahan Yojana",
  "Mukhyamantri Udyami Yojana - SC/ST": "Mukhyamantri SC ST Udyami Yojana",
};

function isBiharApplicable(item: BiharDatasetScheme): boolean {
  if (item.level === "state") {
    return (item.state || "").trim().toLowerCase() === "bihar";
  }
  if (item.level === "central") {
    const appStates = item.applicableStates || [];
    if (appStates.length === 0) return true;
    return appStates.some((s) => ["all", "bihar"].includes(s.trim().toLowerCase()));
  }
  return false;
}

async function migrateUserApplications(
  oldSchemeId: mongoose.Types.ObjectId,
  canonicalSchemeId: mongoose.Types.ObjectId
): Promise<number> {
  const refs = await Application.find({ schemeId: oldSchemeId });
  let migrated = 0;

  for (const app of refs) {
    const existingCanonicalApp = await Application.findOne({
      userId: app.userId,
      schemeId: canonicalSchemeId,
    });

    if (existingCanonicalApp) {
      await Application.deleteOne({ _id: app._id });
    } else {
      await Application.updateOne(
        { _id: app._id },
        { $set: { schemeId: canonicalSchemeId } }
      );
      migrated++;
    }
  }

  return migrated;
}

async function seed(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const datasetPath = path.resolve(__dirname, "../../../data/bihar/all_bihar_schemes.json");

  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Bihar dataset not found at: ${datasetPath}`);
  }

  const rawContent = fs.readFileSync(datasetPath, "utf-8");
  const rawSchemes: BiharDatasetScheme[] = JSON.parse(rawContent);
  const biharSchemes = rawSchemes.filter(isBiharApplicable);

  if (biharSchemes.length === 0) {
    throw new Error("Bihar dataset contains zero Bihar-applicable schemes.");
  }

  console.log(`Connecting to MongoDB at: ${ENV.MONGODB_URI}...`);
  await mongoose.connect(ENV.MONGODB_URI);
  console.log("MongoDB connection established.");

  try {
    const canonicalByName = new Map<string, mongoose.Types.ObjectId>();
    let schemesSynced = 0;
    let rulesSynced = 0;

    console.log(
      `${isDryRun ? "[DRY RUN] Would upsert" : "Upserting"} ${biharSchemes.length} verified Bihar & Central schemes...`
    );

    for (const item of biharSchemes) {
      if (isDryRun) {
        const existing = await Scheme.findOne({ name: item.name }).select("_id");
        if (existing) {
          canonicalByName.set(item.name, existing._id as mongoose.Types.ObjectId);
        }
        schemesSynced++;
        if (item.rule) rulesSynced++;
        continue;
      }

      const schemeUpdate: Record<string, any> = {
        name: item.name,
        aliases: item.aliases ?? [],
        category: item.category,
        level: item.level,
        state: item.level === "state" ? "Bihar" : item.state || "All",
        applicableStates:
          item.applicableStates && item.applicableStates.length > 0
            ? item.applicableStates
            : item.level === "state"
              ? ["Bihar"]
              : ["All"],
        schemeType: (item.schemeType || (item.level === "central" ? "central" : "state")) as SchemeType,
        description: item.description,
        benefits: item.benefits ?? [],
        eligibility: item.eligibility ?? [],
        exclusions: item.exclusions ?? [],
        requiredDocuments: item.requiredDocuments ?? [],
        applicationProcess: item.applicationProcess ?? [],
        officialUrl: item.officialUrl,
        source: item.source,
        sourcePlatform: item.sourcePlatform || "official-portal",
        status: (item.status || "active") as SchemeStatus,
        hasDeterministicRule: item.hasDeterministicRule ?? Boolean(item.rule),
        verificationStatus: "verified" as VerificationStatus,
        verifiedAt: new Date(),
        verifiedBy: "GovGuide Bihar Dataset",
      };

      if (item.applicationUrl) {
        schemeUpdate.applicationUrl = item.applicationUrl;
      }

      const schemeDoc = await Scheme.findOneAndUpdate(
        { name: item.name },
        { $set: schemeUpdate },
        { upsert: true, new: true, runValidators: true }
      );

      canonicalByName.set(item.name, schemeDoc._id as mongoose.Types.ObjectId);
      schemesSynced++;

      if (item.rule) {
        const ruleSet: Record<string, any> = {
          schemeId: schemeDoc._id,
          isVerified: item.rule.isVerified ?? true,
          isComplete: item.rule.isComplete ?? false,
          hasUnsupportedCriteria: item.rule.hasUnsupportedCriteria ?? false,
          unsupportedCriteria: item.rule.unsupportedCriteria ?? [],
          states: item.rule.states ?? (item.level === "state" ? ["Bihar"] : ["All"]),
          occupations: item.rule.occupations ?? [],
          educationLevels: item.rule.educationLevels ?? [],
          categories: item.rule.categories ?? [],
          categoryExemptGenders: item.rule.categoryExemptGenders ?? [],
          genders: item.rule.genders ?? [],
        };

        const ruleUnset: Record<string, any> = {};
        if (item.rule.minAge !== undefined) ruleSet.minAge = item.rule.minAge;
        else ruleUnset.minAge = 1;

        if (item.rule.maxAge !== undefined) ruleSet.maxAge = item.rule.maxAge;
        else ruleUnset.maxAge = 1;

        if (item.rule.maxAnnualIncome !== undefined) ruleSet.maxAnnualIncome = item.rule.maxAnnualIncome;
        else ruleUnset.maxAnnualIncome = 1;

        const updateOps: Record<string, any> = { $set: ruleSet };
        if (Object.keys(ruleUnset).length > 0) {
          updateOps.$unset = ruleUnset;
        }

        await EligibilityRule.findOneAndUpdate(
          { schemeId: schemeDoc._id },
          updateOps,
          { upsert: true, new: true, runValidators: true }
        );
        rulesSynced++;
      }
    }

    // Safely prune non-Bihar schemes and legacy duplicates
    const canonicalNames = new Set(biharSchemes.map((s) => s.name));
    const allDbSchemes = await Scheme.find().select("_id name level state");
    const staleSchemes = allDbSchemes.filter((s) => !canonicalNames.has(s.name));

    let staleRemoved = 0;
    let appsMigrated = 0;
    let appsCleaned = 0;

    for (const stale of staleSchemes) {
      const canonicalName = LEGACY_DUPLICATE_MAP[stale.name];
      const canonicalId = canonicalName ? canonicalByName.get(canonicalName) : undefined;

      if (isDryRun) {
        console.log(
          `[DRY RUN] Would remove stale/non-Bihar scheme: "${stale.name}" (${stale.level}:${stale.state || "N/A"})${
            canonicalName ? ` -> migrate Applications to "${canonicalName}"` : ""
          }`
        );
        staleRemoved++;
        continue;
      }

      if (canonicalId) {
        appsMigrated += await migrateUserApplications(
          stale._id as mongoose.Types.ObjectId,
          canonicalId
        );
      } else {
        const delApps = await Application.deleteMany({ schemeId: stale._id });
        appsCleaned += delApps.deletedCount || 0;
      }

      await EligibilityRule.deleteOne({ schemeId: stale._id });
      await Scheme.deleteOne({ _id: stale._id });
      staleRemoved++;
    }

    // Remove any orphaned EligibilityRules whose schemeId no longer exists
    if (!isDryRun) {
      const activeIds = Array.from(canonicalByName.values());
      await EligibilityRule.deleteMany({ schemeId: { $nin: activeIds } });
    }

    const stateCount = biharSchemes.filter((s) => s.level === "state").length;
    const centralCount = biharSchemes.filter((s) => s.level === "central").length;

    console.log("==================================================");
    console.log(
      `${isDryRun ? "[DRY RUN] Checked" : "Successfully synced"} ${schemesSynced} Bihar-applicable schemes (${stateCount} Bihar State + ${centralCount} Central) and ${rulesSynced} EligibilityRules.`
    );
    console.log(
      `${isDryRun ? "[DRY RUN] Would remove" : "Removed"} ${staleRemoved} stale/non-Bihar schemes (migrated ${appsMigrated} saved/application refs, cleaned ${appsCleaned} obsolete refs).`
    );
    console.log("==================================================");
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected cleanly. Seeding complete.");
  }
}

seed().catch((err) => {
  console.error("Seeding operation failed:", err);
  process.exit(1);
});
