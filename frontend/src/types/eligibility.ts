// eligibility.ts -- TypeScript interfaces for the eligibility API.
// Mirrors the shape produced by backend/src/services/eligibilityService.ts.

/**
 * Three-state eligibility status:
 * - 'eligible': User satisfies all required automated criteria for a complete rule.
 * - 'ineligible': At least one evaluated criterion definitively disqualifies the user.
 * - 'unverified': Insufficient data (missing profile info, incomplete rule, unsupported conditions).
 */
export type EligibilityStatus = 'eligible' | 'ineligible' | 'unverified';

/** One scheme result from GET /api/eligibility */
export interface EligibilityResult {
  schemeId: string;
  schemeName: string;
  status: EligibilityStatus;
  /**
   * Compatibility boolean: true ONLY when status === 'eligible'.
   * False for both 'ineligible' and 'unverified'.
   */
  eligible: boolean;
  /**
   * Human-readable reasons produced by the three-state eligibility engine.
   */
  reasons: string[];
  /** Optional array of demographic fields missing from the citizen profile */
  missingProfileFields?: string[];
}

/** Shape of the GET /api/eligibility response body */
export interface EligibilityApiResponse {
  success?: boolean;
  count?: number;
  results: EligibilityResult[];
}
