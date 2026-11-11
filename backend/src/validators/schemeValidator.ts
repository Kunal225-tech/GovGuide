import { Request, Response, NextFunction } from "express";
import {
  VALID_CATEGORIES,
  VALID_SCHEME_TYPES,
  VALID_VERIFICATION_STATUSES,
  VALID_SCHEME_STATUSES,
} from "../models/Scheme";

const URL_REGEX = /^https?:\/\/.+/i;

export const validateScheme = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    name,
    description,
    category,
    level,
    state,
    officialUrl,
    source,
    schemeType,
    applicableStates,
    applicationUrl,
    verificationStatus,
    status,
    hasDeterministicRule,
  } = req.body;

  const errors: string[] = [];

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    errors.push("Scheme name is required and must be at least 3 characters long.");
  } else if (name.trim().length > 200) {
    errors.push("Scheme name must not exceed 200 characters.");
  }

  if (!description || typeof description !== "string" || description.trim().length < 10) {
    errors.push("Scheme description is required and must be at least 10 characters long.");
  }

  if (!category || typeof category !== "string" || !VALID_CATEGORIES.includes(category as any)) {
    errors.push(
      `Category must be one of the supported sectors: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  if (!level || !["central", "state"].includes(level)) {
    errors.push("Scheme level must be either 'central' or 'state'.");
  } else if (level === "state") {
    if (!state || typeof state !== "string" || state.trim().length === 0) {
      errors.push("State name is mandatory for state-level schemes.");
    }
  }

  if (!officialUrl || typeof officialUrl !== "string" || !URL_REGEX.test(officialUrl.trim())) {
    errors.push("A valid official URL (starting with http:// or https://) is required.");
  }

  if (!source || typeof source !== "string" || source.trim().length === 0) {
    errors.push("Official source / Ministry name is required.");
  }

  // Phase 1 Optional Fields Validation
  if (schemeType !== undefined && !VALID_SCHEME_TYPES.includes(schemeType as any)) {
    errors.push(`schemeType must be one of: ${VALID_SCHEME_TYPES.join(", ")}`);
  }

  if (verificationStatus !== undefined && !VALID_VERIFICATION_STATUSES.includes(verificationStatus as any)) {
    errors.push(`verificationStatus must be one of: ${VALID_VERIFICATION_STATUSES.join(", ")}`);
  }

  if (status !== undefined && !VALID_SCHEME_STATUSES.includes(status as any)) {
    errors.push(`status must be one of: ${VALID_SCHEME_STATUSES.join(", ")}`);
  }

  if (applicationUrl !== undefined && applicationUrl !== null && applicationUrl.trim() !== "") {
    if (typeof applicationUrl !== "string" || !URL_REGEX.test(applicationUrl.trim())) {
      errors.push("applicationUrl must be a valid HTTP or HTTPS URL.");
    }
  }

  if (applicableStates !== undefined && !Array.isArray(applicableStates)) {
    errors.push("applicableStates must be an array of state/UT names.");
  }

  if (hasDeterministicRule !== undefined && typeof hasDeterministicRule !== "boolean") {
    errors.push("hasDeterministicRule must be a boolean value.");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
    return;
  }

  next();
};

export const validateSchemeUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    name,
    description,
    category,
    level,
    state,
    officialUrl,
    schemeType,
    applicableStates,
    applicationUrl,
    verificationStatus,
    status,
    hasDeterministicRule,
  } = req.body;

  const errors: string[] = [];

  if (name !== undefined && (typeof name !== "string" || name.trim().length < 3)) {
    errors.push("Scheme name must be at least 3 characters long.");
  }

  if (description !== undefined && (typeof description !== "string" || description.trim().length < 10)) {
    errors.push("Scheme description must be at least 10 characters long.");
  }

  if (category !== undefined && !VALID_CATEGORIES.includes(category as any)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  if (level !== undefined && !["central", "state"].includes(level)) {
    errors.push("Scheme level must be 'central' or 'state'.");
  }

  if (level === "state" && (!state || typeof state !== "string" || state.trim().length === 0)) {
    errors.push("State name is mandatory when level is set to 'state'.");
  }

  if (officialUrl !== undefined && (typeof officialUrl !== "string" || !URL_REGEX.test(officialUrl.trim()))) {
    errors.push("Official URL must start with http:// or https://.");
  }

  // Phase 1 Optional Fields Validation for updates
  if (schemeType !== undefined && !VALID_SCHEME_TYPES.includes(schemeType as any)) {
    errors.push(`schemeType must be one of: ${VALID_SCHEME_TYPES.join(", ")}`);
  }

  if (verificationStatus !== undefined && !VALID_VERIFICATION_STATUSES.includes(verificationStatus as any)) {
    errors.push(`verificationStatus must be one of: ${VALID_VERIFICATION_STATUSES.join(", ")}`);
  }

  if (status !== undefined && !VALID_SCHEME_STATUSES.includes(status as any)) {
    errors.push(`status must be one of: ${VALID_SCHEME_STATUSES.join(", ")}`);
  }

  if (applicationUrl !== undefined && applicationUrl !== null && applicationUrl.trim() !== "") {
    if (typeof applicationUrl !== "string" || !URL_REGEX.test(applicationUrl.trim())) {
      errors.push("applicationUrl must be a valid HTTP or HTTPS URL.");
    }
  }

  if (applicableStates !== undefined && !Array.isArray(applicableStates)) {
    errors.push("applicableStates must be an array of state/UT names.");
  }

  if (hasDeterministicRule !== undefined && typeof hasDeterministicRule !== "boolean") {
    errors.push("hasDeterministicRule must be a boolean value.");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
    return;
  }

  next();
};
