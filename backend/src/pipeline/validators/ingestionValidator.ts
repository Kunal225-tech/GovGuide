import {
  VALID_CATEGORIES,
  VALID_SCHEME_TYPES,
  VALID_VERIFICATION_STATUSES,
  VALID_SCHEME_STATUSES,
} from "../../models/Scheme";
import { NormalizedSchemeRecord } from "../types";

const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

export interface ValidationOutcome {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a normalized scheme record against schema and data quality rules.
 */
export function validateNormalizedScheme(
  record: NormalizedSchemeRecord
): ValidationOutcome {
  const errors: string[] = [];

  // 1. Name validation
  if (!record.name || record.name.length < 3) {
    errors.push("Scheme name is required and must be at least 3 characters.");
  } else if (record.name.length > 200) {
    errors.push("Scheme name must not exceed 200 characters.");
  }

  // 2. Description validation
  if (!record.description || record.description.length < 10) {
    errors.push("Scheme description is required and must be at least 10 characters.");
  }

  // 3. Category validation
  if (!record.category || !VALID_CATEGORIES.includes(record.category as any)) {
    errors.push(
      `Category '${record.category}' is invalid. Supported: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  // 4. Level validation
  if (!record.level || !["central", "state"].includes(record.level)) {
    errors.push("Scheme level must be 'central' or 'state'.");
  } else if (record.level === "state") {
    const hasState =
      (record.state && record.state.trim().length > 0) ||
      (record.applicableStates && record.applicableStates.length > 0);
    if (!hasState) {
      errors.push("State name is mandatory for state-level schemes.");
    }
  }

  // 5. SchemeType validation
  if (record.schemeType && !VALID_SCHEME_TYPES.includes(record.schemeType as any)) {
    errors.push(
      `schemeType '${record.schemeType}' is invalid. Supported: ${VALID_SCHEME_TYPES.join(", ")}`
    );
  }

  // 6. URL validation
  if (!record.officialUrl || !URL_REGEX.test(record.officialUrl)) {
    errors.push(
      `officialUrl '${record.officialUrl || ""}' must be a valid HTTP or HTTPS URL.`
    );
  }

  if (record.applicationUrl && !URL_REGEX.test(record.applicationUrl)) {
    errors.push(
      `applicationUrl '${record.applicationUrl}' must be a valid HTTP or HTTPS URL.`
    );
  }

  if (record.officialDocUrl && !URL_REGEX.test(record.officialDocUrl)) {
    errors.push(
      `officialDocUrl '${record.officialDocUrl}' must be a valid HTTP or HTTPS URL.`
    );
  }

  // 7. Source attribution validation
  if (!record.source || record.source.trim().length === 0) {
    errors.push("Official source / department attribution is required.");
  }

  // 8. Enums validation
  if (
    record.verificationStatus &&
    !VALID_VERIFICATION_STATUSES.includes(record.verificationStatus as any)
  ) {
    errors.push(`Invalid verificationStatus: ${record.verificationStatus}`);
  }

  if (record.status && !VALID_SCHEME_STATUSES.includes(record.status as any)) {
    errors.push(`Invalid scheme status: ${record.status}`);
  }

  // 9. Structured Rule validation (if present)
  if (record.rule) {
    const r = record.rule;
    if (r.minAge !== undefined && (r.minAge < 0 || r.minAge > 120)) {
      errors.push(`minAge (${r.minAge}) is out of realistic bounds [0-120].`);
    }
    if (r.maxAge !== undefined && (r.maxAge < 0 || r.maxAge > 120)) {
      errors.push(`maxAge (${r.maxAge}) is out of realistic bounds [0-120].`);
    }
    if (
      r.minAge !== undefined &&
      r.maxAge !== undefined &&
      r.minAge > r.maxAge
    ) {
      errors.push(`minAge (${r.minAge}) cannot exceed maxAge (${r.maxAge}).`);
    }
    if (r.maxAnnualIncome !== undefined && r.maxAnnualIncome < 0) {
      errors.push("maxAnnualIncome cannot be negative.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
