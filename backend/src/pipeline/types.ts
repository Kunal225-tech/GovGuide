import {
  SchemeCategory,
  SchemeType,
  VerificationStatus,
  SchemeStatus,
} from "../models/Scheme";

/**
 * Raw rule payload accepted from incoming JSON or CSV records.
 */
export interface RawRuleInput {
  minAge?: number | string;
  maxAge?: number | string;
  maxAnnualIncome?: number | string;
  states?: string[] | string;
  occupations?: string[] | string;
  educationLevels?: string[] | string;
  categories?: string[] | string;
  genders?: string[] | string;
  isVerified?: boolean | string;
  isComplete?: boolean | string;
  hasUnsupportedCriteria?: boolean | string;
  unsupportedCriteria?: string[] | string;
}

/**
 * Raw scheme payload accepted from incoming JSON or CSV records.
 * Can be loose and untrusted before normalization and validation.
 */
export interface RawSchemeInput {
  name: string;
  description: string;
  category: string;
  level?: string;
  state?: string;
  schemeType?: string;
  applicableStates?: string[] | string;
  benefits?: string[] | string;
  eligibility?: string[] | string;
  requiredDocuments?: string[] | string;
  applicationProcess?: string[] | string;
  officialUrl: string;
  applicationUrl?: string;
  source: string;
  sourcePlatform?: string;
  sourceId?: string;
  verificationStatus?: string;
  status?: string;
  hasDeterministicRule?: boolean | string;
  aliases?: string[] | string;
  exclusions?: string[] | string;
  officialDocUrl?: string;
  sourceDocumentTitle?: string;
  verifiedBy?: string;
  unresolvedQuestions?: string[] | string;
  rule?: RawRuleInput;
}

/**
 * Normalized internal rule record ready for database upsert.
 */
export interface NormalizedRuleRecord {
  minAge?: number;
  maxAge?: number;
  maxAnnualIncome?: number;
  states: string[];
  occupations: string[];
  educationLevels: string[];
  categories: string[];
  genders: string[];
  isVerified: boolean;
  isComplete?: boolean;
  hasUnsupportedCriteria?: boolean;
  unsupportedCriteria?: string[];
}

/**
 * Normalized internal scheme record ready for database validation & upsert.
 */
export interface NormalizedSchemeRecord {
  name: string;
  description: string;
  category: SchemeCategory;
  level: "central" | "state";
  state?: string;
  schemeType?: SchemeType;
  applicableStates: string[];
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialUrl: string;
  applicationUrl?: string;
  source: string;
  sourcePlatform: string;
  sourceId?: string;
  verificationStatus: VerificationStatus;
  explicitVerificationStatus?: VerificationStatus;
  status: SchemeStatus;
  hasDeterministicRule: boolean;
  verifiedAt?: Date;
  aliases?: string[];
  exclusions?: string[];
  officialDocUrl?: string;
  sourceDocumentTitle?: string;
  verifiedBy?: string;
  unresolvedQuestions?: string[];
  normalizedNameSlug: string;
  rule?: NormalizedRuleRecord;
}

/**
 * Options to control the ingestion process.
 */
export interface IngestionOptions {
  /** If true, processes validation and conflict detection without writing to MongoDB */
  dryRun?: boolean;
  /** If true, updates matched existing schemes. If false, skips existing schemes */
  allowUpdates?: boolean;
  /** If true, syncs attached structured EligibilityRule records when provided */
  importRules?: boolean;
  /** Fallback platform attribution if not specified in incoming record */
  defaultSourcePlatform?: string;
}

/**
 * Ingestion outcome for an individual scheme record.
 */
export interface IngestionRecordResult {
  status: "created" | "updated" | "skipped" | "invalid" | "conflict";
  schemeName: string;
  schemeId?: string;
  reasons: string[];
  errors?: string[];
  diff?: Record<string, { old: any; new: any }>;
}

/**
 * Comprehensive summary report returned upon pipeline execution.
 */
export interface IngestionSummary {
  totalRead: number;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  conflicts: number;
  records: IngestionRecordResult[];
  durationMs: number;
  timestamp: string;
}
