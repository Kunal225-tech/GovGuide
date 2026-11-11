import {
  VALID_CATEGORIES,
  VALID_SCHEME_TYPES,
  VALID_VERIFICATION_STATUSES,
  VALID_SCHEME_STATUSES,
  SchemeCategory,
  SchemeType,
  VerificationStatus,
  SchemeStatus,
} from "../../models/Scheme";
import { RawSchemeInput, NormalizedSchemeRecord } from "../types";
import { normalizeRuleInput } from "./ruleNormalizer";

/**
 * Robustly parses a field that may be a native array, JSON string, or delimited text.
 */
export function parseArrayField(
  val: string[] | string | undefined,
  delimiterRegex: RegExp = /[;\n|]/
): string[] {
  if (!val) return [];

  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
      .filter((item) => item.length > 0);
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];

    // Attempt JSON parse if it looks like an array
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0);
        }
      } catch {
        // Fall back to delimiter splitting
      }
    }

    return trimmed
      .split(delimiterRegex)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

/**
 * Creates a deterministic, URL-friendly normalized slug from a scheme title.
 */
export function slugifySchemeName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/[\s_-]+/g, "-") // Collapse whitespace and underscores to single hyphen
    .replace(/^-+|-+$/g, ""); // Strip leading and trailing hyphens
}

/**
 * Normalizes a raw scheme input into a clean, strongly typed internal scheme record.
 */
export function normalizeSchemeInput(
  raw: RawSchemeInput,
  defaultPlatform: string = "local-import"
): NormalizedSchemeRecord {
  const name = typeof raw.name === "string" ? raw.name.trim() : String(raw.name || "").trim();
  const description =
    typeof raw.description === "string"
      ? raw.description.trim()
      : String(raw.description || "").trim();

  // Normalize Category (Case-insensitive matching against VALID_CATEGORIES)
  const rawCat = typeof raw.category === "string" ? raw.category.trim() : "";
  const matchedCategory =
    VALID_CATEGORIES.find((cat) => cat.toLowerCase() === rawCat.toLowerCase()) ||
    (rawCat as SchemeCategory);

  // Normalize Level & SchemeType
  let levelStr = typeof raw.level === "string" ? raw.level.trim().toLowerCase() : "";
  let typeStr = typeof raw.schemeType === "string" ? raw.schemeType.trim().toLowerCase() : "";

  // Normalize spaces/dashes in schemeType (e.g. "central sector" -> "central-sector")
  typeStr = typeStr.replace(/\s+/g, "-");

  if (!levelStr) {
    if (typeStr === "central-sector" || typeStr === "centrally-sponsored") {
      levelStr = "central";
    } else if (typeStr === "state" || typeStr === "ut") {
      levelStr = "state";
    } else {
      levelStr = "central"; // Default
    }
  }

  const level = (levelStr === "state" ? "state" : "central") as "central" | "state";

  let schemeType: SchemeType | undefined;
  if (VALID_SCHEME_TYPES.includes(typeStr as any)) {
    schemeType = typeStr as SchemeType;
  } else if (level === "state") {
    schemeType = "state";
  } else {
    schemeType = "central-sector";
  }

  // Normalize States
  let state = typeof raw.state === "string" && raw.state.trim() ? raw.state.trim() : undefined;
  const applicableStates = parseArrayField(raw.applicableStates, /[,;\n|]/);

  if (state && !applicableStates.includes(state)) {
    applicableStates.unshift(state);
  } else if (!state && applicableStates.length === 1 && level === "state") {
    state = applicableStates[0];
  }

  // Normalize Array lists
  const benefits = parseArrayField(raw.benefits);
  const eligibility = parseArrayField(raw.eligibility);
  const requiredDocuments = parseArrayField(raw.requiredDocuments);
  const applicationProcess = parseArrayField(raw.applicationProcess);
  const aliases = parseArrayField(raw.aliases, /[,;\n|]/);
  const exclusions = parseArrayField(raw.exclusions);
  const unresolvedQuestions = parseArrayField(raw.unresolvedQuestions);

  // Normalize URLs
  const officialUrl =
    typeof raw.officialUrl === "string" ? raw.officialUrl.trim() : "";
  const applicationUrl =
    typeof raw.applicationUrl === "string" && raw.applicationUrl.trim()
      ? raw.applicationUrl.trim()
      : undefined;
  const officialDocUrl =
    typeof raw.officialDocUrl === "string" && raw.officialDocUrl.trim()
      ? raw.officialDocUrl.trim()
      : undefined;

  // Normalize Source & Provenance
  const source = typeof raw.source === "string" ? raw.source.trim() : "";
  const sourcePlatform =
    typeof raw.sourcePlatform === "string" && raw.sourcePlatform.trim()
      ? raw.sourcePlatform.trim()
      : defaultPlatform;
  const sourceId =
    typeof raw.sourceId === "string" && raw.sourceId.trim()
      ? raw.sourceId.trim()
      : undefined;
  const sourceDocumentTitle =
    typeof raw.sourceDocumentTitle === "string" && raw.sourceDocumentTitle.trim()
      ? raw.sourceDocumentTitle.trim()
      : undefined;
  const verifiedBy =
    typeof raw.verifiedBy === "string" && raw.verifiedBy.trim()
      ? raw.verifiedBy.trim()
      : undefined;

  // Status (defaults to 'active')
  const rawStatus = typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "";
  const status: SchemeStatus = VALID_SCHEME_STATUSES.includes(rawStatus as any)
    ? (rawStatus as SchemeStatus)
    : "active";

  // Verification Status (defaults to 'unverified' for new records, but tracks explicit status)
  const rawVer =
    typeof raw.verificationStatus === "string"
      ? raw.verificationStatus.trim().toLowerCase()
      : "";
  const hasExplicitVerification =
    Boolean(rawVer) && VALID_VERIFICATION_STATUSES.includes(rawVer as any);
  const explicitVerificationStatus: VerificationStatus | undefined =
    hasExplicitVerification ? (rawVer as VerificationStatus) : undefined;
  const verificationStatus: VerificationStatus =
    explicitVerificationStatus || "unverified";

  // Rule Normalization
  const rule = normalizeRuleInput(raw.rule);
  const hasDeterministicRule =
    typeof raw.hasDeterministicRule === "boolean"
      ? raw.hasDeterministicRule
      : raw.hasDeterministicRule === "true"
      ? true
      : raw.hasDeterministicRule === "false"
      ? false
      : Boolean(rule && rule.isVerified);

  return {
    name,
    description,
    category: matchedCategory,
    level,
    state,
    schemeType,
    applicableStates,
    benefits,
    eligibility,
    requiredDocuments,
    applicationProcess,
    officialUrl,
    applicationUrl,
    officialDocUrl,
    source,
    sourcePlatform,
    sourceId,
    sourceDocumentTitle,
    verifiedBy,
    aliases,
    exclusions,
    unresolvedQuestions,
    verificationStatus,
    explicitVerificationStatus,
    status,
    hasDeterministicRule,
    verifiedAt: verificationStatus === "verified" ? new Date() : undefined,
    normalizedNameSlug: slugifySchemeName(name),
    rule,
  };
}
