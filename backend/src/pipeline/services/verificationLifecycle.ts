/**
 * verificationLifecycle.ts
 *
 * Implements strict separation between:
 * A. Source Provenance (officialPortalUrl, officialDocUrl, sourceDocumentTitle)
 * B. Verification Attestation (explicit status action, authorized reviewer identity, timestamp)
 *
 * Enforces:
 * 1. Transition to 'verified' strictly requires BOTH valid source provenance AND an explicit,
 *    authorized reviewer identity (`verifiedBy`) supplied in the incoming payload.
 * 2. An official URL alone or a document title alone is NEVER sufficient to verify.
 * 3. Historical `existing.verifiedBy` does NOT authorize a new verification action without
 *    an explicit reviewer identity in the incoming payload.
 * 4. Missing reviewer or provenance fails safely to 'needs-review' or 'unverified'.
 * 5. Explicit 'unverified', 'disputed', or 'needs-review' updates downgrade status and clear `verifiedAt`.
 * 6. Omitted incoming verification status preserves existing database status and timestamp.
 */

import { VerificationStatus } from "../../models/Scheme";
import { NormalizedSchemeRecord } from "../types";

export interface VerificationResolution {
  verificationStatus?: VerificationStatus;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
}

/**
 * Evaluates verification status transition for an incoming scheme record.
 * Handles both new records (existing === null/undefined) and updates.
 */
export function resolveVerificationTransition(
  incoming: NormalizedSchemeRecord,
  existing?: {
    verificationStatus?: VerificationStatus;
    verifiedAt?: Date | null;
    verifiedBy?: string | null;
    officialUrl?: string;
    sourceDocumentTitle?: string;
    officialDocUrl?: string;
  } | null
): VerificationResolution {
  // If verification status was omitted from the incoming update payload:
  // Strictly preserve existing status and timestamp (do not change)
  if (incoming.explicitVerificationStatus === undefined) {
    return {};
  }

  const targetStatus = incoming.explicitVerificationStatus;

  // 1. Explicit Downgrade or Reassessment
  if (
    targetStatus === "unverified" ||
    targetStatus === "disputed" ||
    targetStatus === "needs-review"
  ) {
    return {
      verificationStatus: targetStatus,
      verifiedAt: null, // Clear timestamp on downgrade/dispute
    };
  }

  // 2. Explicit 'verified' Action Requested
  if (targetStatus === "verified") {
    // Provenance Check: Requires (sourceDocumentTitle OR officialDocUrl) AND officialUrl
    const effectiveOfficialUrl = incoming.officialUrl || existing?.officialUrl;
    const effectiveDocTitle = incoming.sourceDocumentTitle || existing?.sourceDocumentTitle;
    const effectiveDocUrl = incoming.officialDocUrl || existing?.officialDocUrl;

    const hasProvenance = Boolean(
      (effectiveDocTitle || effectiveDocUrl) &&
      effectiveOfficialUrl &&
      effectiveOfficialUrl.trim().length > 0
    );

    // Reviewer Attestation Check:
    // Must be explicitly supplied in the incoming payload (not inherited from existing)
    const incomingReviewer =
      typeof incoming.verifiedBy === "string" ? incoming.verifiedBy.trim() : "";
    const hasValidReviewer = incomingReviewer.length >= 3;

    if (hasProvenance && hasValidReviewer) {
      // Both provenance and fresh reviewer attestation are satisfied
      return {
        verificationStatus: "verified",
        verifiedAt:
          incoming.verifiedAt ||
          (existing?.verifiedAt ? existing.verifiedAt : new Date()),
        verifiedBy: incomingReviewer,
      };
    }

    // Safety Gate: Missing reviewer or provenance fails safely
    // Assigns 'needs-review' if provenance exists but reviewer is missing; otherwise 'unverified'.
    const safeFallbackStatus: VerificationStatus = hasProvenance
      ? "needs-review"
      : "unverified";

    return {
      verificationStatus: safeFallbackStatus,
      verifiedAt: null, // Clear verification timestamp because attestation was inadequate
    };
  }

  return {};
}

