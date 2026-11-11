import { RawRuleInput, NormalizedRuleRecord } from "../types";
import { parseArrayField } from "./schemeNormalizer";

const VALID_GENDER_CANONICAL: Record<string, string> = {
  male: "Male",
  female: "Female",
  transgender: "Transgender",
  other: "Other",
  all: "All",
};

/**
 * Normalizes optional structured eligibility rules.
 * Strictly adheres to Phase 1 eligibility safety:
 * Never infers criteria; returns undefined if no structured criteria are provided.
 */
export function normalizeRuleInput(
  raw?: RawRuleInput
): NormalizedRuleRecord | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  // Parse Numeric Bounds
  let minAge: number | undefined;
  if (raw.minAge !== undefined && raw.minAge !== null && String(raw.minAge).trim() !== "") {
    const parsed = parseInt(String(raw.minAge).trim(), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      minAge = parsed;
    }
  }

  let maxAge: number | undefined;
  if (raw.maxAge !== undefined && raw.maxAge !== null && String(raw.maxAge).trim() !== "") {
    const parsed = parseInt(String(raw.maxAge).trim(), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      maxAge = parsed;
    }
  }

  let maxAnnualIncome: number | undefined;
  if (
    raw.maxAnnualIncome !== undefined &&
    raw.maxAnnualIncome !== null &&
    String(raw.maxAnnualIncome).trim() !== ""
  ) {
    const parsed = parseFloat(String(raw.maxAnnualIncome).trim().replace(/[,\s₹]/g, ""));
    if (!isNaN(parsed) && parsed >= 0) {
      maxAnnualIncome = parsed;
    }
  }

  // Parse Array Fields
  const states = parseArrayField(raw.states, /[,;\n|]/);
  const occupations = parseArrayField(raw.occupations, /[,;\n|]/);
  const educationLevels = parseArrayField(raw.educationLevels, /[,;\n|]/);
  const categories = parseArrayField(raw.categories, /[,;\n|]/);

  // Parse & Canonicalize Genders
  const rawGenders = parseArrayField(raw.genders, /[,;\n|]/);
  const genders: string[] = [];
  for (const g of rawGenders) {
    const lower = g.toLowerCase();
    if (VALID_GENDER_CANONICAL[lower]) {
      genders.push(VALID_GENDER_CANONICAL[lower]);
    }
  }

  // Verification State (Defaults safely to false unless explicitly confirmed)
  const isVerified =
    typeof raw.isVerified === "boolean"
      ? raw.isVerified
      : raw.isVerified === "true"
      ? true
      : false;

  const isComplete =
    typeof raw.isComplete === "boolean"
      ? raw.isComplete
      : raw.isComplete === "true"
      ? true
      : false;

  const unsupportedCriteria = parseArrayField(raw.unsupportedCriteria, /[,;\n|]/);

  let hasUnsupportedCriteria: boolean;
  if (typeof raw.hasUnsupportedCriteria === "boolean") {
    hasUnsupportedCriteria = raw.hasUnsupportedCriteria;
  } else if (raw.hasUnsupportedCriteria === "true") {
    hasUnsupportedCriteria = true;
  } else if (raw.hasUnsupportedCriteria === "false") {
    hasUnsupportedCriteria = false;
  } else {
    hasUnsupportedCriteria = unsupportedCriteria.length > 0;
  }

  // Check if at least one criterion (demographic bound OR procedural/unsupported condition) is defined
  const hasCriteria =
    minAge !== undefined ||
    maxAge !== undefined ||
    maxAnnualIncome !== undefined ||
    states.length > 0 ||
    occupations.length > 0 ||
    educationLevels.length > 0 ||
    categories.length > 0 ||
    genders.length > 0 ||
    hasUnsupportedCriteria ||
    unsupportedCriteria.length > 0;

  if (!hasCriteria) {
    return undefined;
  }

  return {
    minAge,
    maxAge,
    maxAnnualIncome,
    states,
    occupations,
    educationLevels,
    categories,
    genders,
    isVerified,
    isComplete,
    hasUnsupportedCriteria,
    unsupportedCriteria,
  };
}
