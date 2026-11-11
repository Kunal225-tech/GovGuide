import fs from "fs";
import path from "path";
import { SourceAdapter } from "./baseAdapter";
import { RawSchemeInput, RawRuleInput } from "../types";
import { parseCsvText, ParsedCsvRow } from "./csvParser";

export interface CsvAdapterOptions {
  filePath?: string;
  csvContent?: string;
  sourcePlatform?: string;
  maxSizeBytes?: number; // Default: 10MB
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Adapter to ingest scheme data from CSV files or strings.
 */
export class CsvAdapter implements SourceAdapter {
  readonly adapterName = "CsvAdapter";
  readonly sourcePlatform: string;
  private filePath?: string;
  private csvContent?: string;
  private maxSizeBytes: number;

  constructor(options: CsvAdapterOptions) {
    this.filePath = options.filePath;
    this.csvContent = options.csvContent;
    this.sourcePlatform = options.sourcePlatform || "local-csv";
    this.maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB
  }

  async load(): Promise<RawSchemeInput[]> {
    let content = this.csvContent;

    if (!content && this.filePath) {
      const resolvedPath = path.resolve(this.filePath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`CSV file not found at path: ${this.filePath}`);
      }

      const stats = await fs.promises.stat(resolvedPath);
      if (stats.size > this.maxSizeBytes) {
        throw new Error(
          `CSV file size (${stats.size} bytes) exceeds maximum permitted limit of ${this.maxSizeBytes} bytes.`
        );
      }

      content = await fs.promises.readFile(resolvedPath, "utf-8");
    }

    if (!content || !content.trim()) {
      return [];
    }

    const rows = parseCsvText(content);
    return rows.map((row) => this.mapRowToRawScheme(row));
  }

  private mapRowToRawScheme(row: ParsedCsvRow): RawSchemeInput {
    // Create normalized dictionary for flexible column name matching
    const dict: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      dict[normalizeKey(k)] = v;
    }

    const get = (...keys: string[]): string => {
      for (const k of keys) {
        const norm = normalizeKey(k);
        if (dict[norm] !== undefined && dict[norm].length > 0) {
          return dict[norm];
        }
      }
      return "";
    };

    // Extract Rule Fields if present in row
    let rule: RawRuleInput | undefined;
    const minAge = get("minage", "ruleminage");
    const maxAge = get("maxage", "rulemaxage");
    const maxIncome = get("maxannualincome", "maxincome", "rulemaxincome");
    const ruleStates = get("rulestates");
    const occupations = get("occupations", "ruleoccupations");
    const education = get("educationlevels", "education", "ruleeducation");
    const categories = get("categories", "rulecategories");
    const genders = get("genders", "gender", "rulegenders");
    const isVerified = get("isverified", "ruleverified");

    if (
      minAge ||
      maxAge ||
      maxIncome ||
      ruleStates ||
      occupations ||
      education ||
      categories ||
      genders
    ) {
      rule = {
        minAge: minAge || undefined,
        maxAge: maxAge || undefined,
        maxAnnualIncome: maxIncome || undefined,
        states: ruleStates || undefined,
        occupations: occupations || undefined,
        educationLevels: education || undefined,
        categories: categories || undefined,
        genders: genders || undefined,
        isVerified: isVerified ? isVerified.toLowerCase() === "true" : undefined,
      };
    }

    return {
      name: get("name", "schemename", "title"),
      description: get("description", "summary", "details"),
      category: get("category", "sector"),
      level: get("level"),
      state: get("state"),
      schemeType: get("schemetype", "type"),
      applicableStates: get("applicablestates", "states"),
      benefits: get("benefits"),
      eligibility: get("eligibility", "eligibilitycriteria"),
      requiredDocuments: get("requireddocuments", "documents"),
      applicationProcess: get("applicationprocess", "process", "steps"),
      officialUrl: get("officialurl", "url", "officiallink"),
      applicationUrl: get("applicationurl", "applyurl", "link"),
      source: get("source", "ministry", "department"),
      sourcePlatform: get("sourceplatform") || this.sourcePlatform,
      sourceId: get("sourceid", "id", "externalid"),
      verificationStatus: get("verificationstatus"),
      status: get("status"),
      hasDeterministicRule: get("hasdeterministicrule"),
      rule,
    };
  }
}
