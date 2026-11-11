import Scheme, { IScheme } from "../../models/Scheme";
import EligibilityRule from "../../models/EligibilityRule";
import { SourceAdapter } from "../adapters/baseAdapter";
import { normalizeSchemeInput } from "../normalizers/schemeNormalizer";
import { validateNormalizedScheme } from "../validators/ingestionValidator";
import { identifyDuplicate } from "../deduplicator";
import { AuditLogger } from "../auditLogger";
import { resolveVerificationTransition } from "./verificationLifecycle";
import {
  IngestionOptions,
  IngestionSummary,
  NormalizedSchemeRecord,
} from "../types";

/**
 * Builds a field-by-field diff between an existing document and proposed update fields.
 */
function computeDiff(
  existing: IScheme,
  updates: Record<string, any>
): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {};

  for (const [key, newVal] of Object.entries(updates)) {
    if (newVal === undefined) continue;

    const oldVal = (existing as any)[key];

    if (Array.isArray(newVal)) {
      const oldArr = Array.isArray(oldVal) ? oldVal : [];
      if (
        oldArr.length !== newVal.length ||
        !newVal.every((item, i) => item === oldArr[i])
      ) {
        diff[key] = { old: oldArr, new: newVal };
      }
    } else if (oldVal !== newVal) {
      diff[key] = { old: oldVal, new: newVal };
    }
  }

  return diff;
}

/**
 * Orchestrates safe, robust, and idempotent scheme data ingestion into MongoDB.
 */
export class IngestionService {
  /**
   * Executes the ingestion pipeline for a given source adapter.
   */
  static async ingest(
    adapter: SourceAdapter,
    options: IngestionOptions = {}
  ): Promise<IngestionSummary> {
    const logger = new AuditLogger();
    const dryRun = Boolean(options.dryRun);
    const allowUpdates = options.allowUpdates !== false; // Default: true
    const importRules = options.importRules !== false; // Default: true
    const defaultPlatform = options.defaultSourcePlatform || adapter.sourcePlatform;

    // Load raw records from adapter
    const rawItems = await adapter.load();

    // Track names within this single import batch to handle duplicate entries in the same file
    const batchSeenNames = new Map<string, number>();

    for (let index = 0; index < rawItems.length; index++) {
      const raw = rawItems[index];

      // 1. Normalization
      const normalized: NormalizedSchemeRecord = normalizeSchemeInput(
        raw,
        defaultPlatform
      );

      // Check intra-batch duplication
      const slug = normalized.normalizedNameSlug;
      if (batchSeenNames.has(slug)) {
        logger.record({
          status: "skipped",
          schemeName: normalized.name || `Row #${index + 1}`,
          reasons: [
            `Duplicate record inside the same import batch (first seen at row #${
              batchSeenNames.get(slug)! + 1
            }).`,
          ],
        });
        continue;
      }
      batchSeenNames.set(slug, index);

      // 2. Validation
      const validation = validateNormalizedScheme(normalized);
      if (!validation.isValid) {
        logger.record({
          status: "invalid",
          schemeName: normalized.name || `Row #${index + 1}`,
          errors: validation.errors,
          reasons: ["Validation failed. Record discarded to prevent database corruption."],
        });
        continue;
      }

      // 3. Deduplication & Conflict Detection
      const dedup = await identifyDuplicate(normalized);

      if (dedup.matchType === "CONFLICT") {
        logger.record({
          status: "conflict",
          schemeName: normalized.name,
          schemeId: dedup.existingScheme?._id?.toString(),
          reasons: [
            dedup.conflictReason ||
              "Potential collision with existing scheme. Held for review.",
          ],
        });
        continue;
      }

      // 4. Handle Truly New Scheme
      if (dedup.matchType === "NEW") {
        if (dryRun) {
          logger.record({
            status: "created",
            schemeName: normalized.name,
            reasons: ["Dry run mode: Valid new scheme ready to insert."],
          });
          continue;
        }

        // Prepare database document
        const initialVer = resolveVerificationTransition(normalized, null);
        const schemeDoc = new Scheme({
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

        const savedScheme = await schemeDoc.save();

        // Optional rule creation (Strictly gated by Step 7)
        if (importRules && normalized.rule) {
          await EligibilityRule.create({
            schemeId: savedScheme._id,
            ...normalized.rule,
          });
        }

        logger.record({
          status: "created",
          schemeName: savedScheme.name,
          schemeId: savedScheme._id.toString(),
          reasons: ["New scheme successfully created in MongoDB."],
        });
        continue;
      }

      // 5. Handle Existing Scheme Match (EXACT_NAME or EXACT_SOURCE_ID)
      const existing = dedup.existingScheme!;

      if (!allowUpdates) {
        logger.record({
          status: "skipped",
          schemeName: existing.name,
          schemeId: existing._id.toString(),
          reasons: ["Scheme already exists and allowUpdates=false."],
        });
        continue;
      }

      // Build safe update payload - DO NOT overwrite good data with empty incoming values
      const updatePayload: Record<string, any> = {};

      if (normalized.description && normalized.description.length >= 10) {
        updatePayload.description = normalized.description;
      }
      if (normalized.category) {
        updatePayload.category = normalized.category;
      }
      if (normalized.level) {
        updatePayload.level = normalized.level;
      }
      if (normalized.state) {
        updatePayload.state = normalized.state;
      }
      if (normalized.schemeType) {
        updatePayload.schemeType = normalized.schemeType;
      }
      if (normalized.applicableStates.length > 0) {
        updatePayload.applicableStates = normalized.applicableStates;
      }
      if (normalized.benefits.length > 0) {
        updatePayload.benefits = normalized.benefits;
      }
      if (normalized.eligibility.length > 0) {
        updatePayload.eligibility = normalized.eligibility;
      }
      if (normalized.requiredDocuments.length > 0) {
        updatePayload.requiredDocuments = normalized.requiredDocuments;
      }
      if (normalized.applicationProcess.length > 0) {
        updatePayload.applicationProcess = normalized.applicationProcess;
      }
      if (normalized.officialUrl) {
        updatePayload.officialUrl = normalized.officialUrl;
      }
      if (normalized.applicationUrl) {
        updatePayload.applicationUrl = normalized.applicationUrl;
      }
      if (normalized.source) {
        updatePayload.source = normalized.source;
      }
      if (normalized.sourceId) {
        updatePayload.sourceId = normalized.sourceId;
      }
      if (normalized.sourcePlatform) {
        updatePayload.sourcePlatform = normalized.sourcePlatform;
      }
      if (normalized.status) {
        updatePayload.status = normalized.status;
      }
      if (normalized.officialDocUrl) {
        updatePayload.officialDocUrl = normalized.officialDocUrl;
      }
      if (normalized.sourceDocumentTitle) {
        updatePayload.sourceDocumentTitle = normalized.sourceDocumentTitle;
      }
      if (normalized.verifiedBy) {
        updatePayload.verifiedBy = normalized.verifiedBy;
      }
      if (normalized.aliases && normalized.aliases.length > 0) {
        updatePayload.aliases = normalized.aliases;
      }
      if (normalized.exclusions && normalized.exclusions.length > 0) {
        updatePayload.exclusions = normalized.exclusions;
      }
      if (normalized.unresolvedQuestions && normalized.unresolvedQuestions.length > 0) {
        updatePayload.unresolvedQuestions = normalized.unresolvedQuestions;
      }

      // Synchronize hasDeterministicRule when explicitly supplied in normalized record
      if (normalized.hasDeterministicRule !== undefined) {
        updatePayload.hasDeterministicRule = normalized.hasDeterministicRule;
      }

      // Verification status lifecycle & verifiedAt handling
      const verTransition = resolveVerificationTransition(normalized, existing);
      if (verTransition.verificationStatus !== undefined) {
        updatePayload.verificationStatus = verTransition.verificationStatus;
        updatePayload.verifiedAt = verTransition.verifiedAt;
        if (verTransition.verifiedBy) {
          updatePayload.verifiedBy = verTransition.verifiedBy;
        }
      }

      const diff = computeDiff(existing, updatePayload);
      const hasChanges = Object.keys(diff).length > 0;

      if (!hasChanges) {
        logger.record({
          status: "skipped",
          schemeName: existing.name,
          schemeId: existing._id.toString(),
          reasons: ["Record matches existing scheme; no new fields to update."],
        });
        continue;
      }

      if (dryRun) {
        logger.record({
          status: "updated",
          schemeName: existing.name,
          schemeId: existing._id.toString(),
          reasons: ["Dry run mode: Matched existing scheme, update diff calculated."],
          diff,
        });
        continue;
      }

      // Safe update - strictly preserves existing MongoDB _id
      const updatedScheme = await Scheme.findByIdAndUpdate(
        existing._id,
        { $set: updatePayload },
        { new: true, runValidators: true }
      );

      // Optional rule update (Gated by Step 7)
      if (importRules && normalized.rule && updatedScheme) {
        await EligibilityRule.findOneAndUpdate(
          { schemeId: updatedScheme._id },
          {
            $set: {
              schemeId: updatedScheme._id,
              ...normalized.rule,
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
      }

      logger.record({
        status: "updated",
        schemeName: existing.name,
        schemeId: existing._id.toString(),
        reasons: ["Existing scheme record updated safely while preserving MongoDB _id."],
        diff,
      });
    }

    return logger.getSummary();
  }
}
