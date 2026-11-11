/**
 * cli.ts
 * Command-line runner for GovGuide Scheme Data Ingestion Pipeline.
 *
 * Usage:
 *   npx ts-node src/pipeline/cli.ts --file data/samples/sample_schemes.json --format json
 *   npx ts-node src/pipeline/cli.ts --file data/samples/sample_schemes.csv --format csv --dry-run
 */

import path from "path";
import mongoose from "mongoose";
import { ENV } from "../config/env";
import { JsonAdapter } from "./adapters/jsonAdapter";
import { CsvAdapter } from "./adapters/csvAdapter";
import { IngestionService } from "./services/ingestionService";
import { IngestionOptions } from "./types";

interface ParsedCliArgs {
  file?: string;
  format?: "json" | "csv";
  dryRun: boolean;
  allowUpdates: boolean;
  importRules: boolean;
}

function parseArgs(): ParsedCliArgs {
  const args = process.argv.slice(2);
  const result: ParsedCliArgs = {
    dryRun: false,
    allowUpdates: true,
    importRules: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--file" && i + 1 < args.length) {
      result.file = args[++i];
    } else if (arg === "--format" && i + 1 < args.length) {
      const f = args[++i].toLowerCase();
      if (f === "json" || f === "csv") {
        result.format = f;
      }
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--no-updates") {
      result.allowUpdates = false;
    } else if (arg === "--no-rules") {
      result.importRules = false;
    }
  }

  return result;
}

async function runCli(): Promise<void> {
  const args = parseArgs();

  if (!args.file) {
    console.error("Error: --file argument is required.");
    console.log("Usage: npx ts-node src/pipeline/cli.ts --file <path> [--format json|csv] [--dry-run]");
    process.exit(1);
  }

  const filePath = path.resolve(args.file);
  let format = args.format;

  if (!format) {
    if (filePath.endsWith(".csv")) format = "csv";
    else if (filePath.endsWith(".json")) format = "json";
    else {
      console.error("Error: Unable to infer format from file extension. Please pass --format json or --format csv.");
      process.exit(1);
    }
  }

  console.log("==================================================");
  console.log("GovGuide Data Ingestion Pipeline CLI");
  console.log(`Source File : ${filePath}`);
  console.log(`Format      : ${format.toUpperCase()}`);
  console.log(`Dry Run     : ${args.dryRun}`);
  console.log(`Allow Update: ${args.allowUpdates}`);
  console.log(`Import Rules: ${args.importRules}`);
  console.log("==================================================");

  try {
    console.log(`Connecting to MongoDB at: ${ENV.MONGODB_URI}...`);
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Database connected.\n");

    const adapter =
      format === "csv"
        ? new CsvAdapter({ filePath })
        : new JsonAdapter({ filePath });

    const options: IngestionOptions = {
      dryRun: args.dryRun,
      allowUpdates: args.allowUpdates,
      importRules: args.importRules,
      defaultSourcePlatform: `cli-${format}`,
    };

    const summary = await IngestionService.ingest(adapter, options);

    console.log("\n==================================================");
    console.log("Ingestion Run Summary");
    console.log("==================================================");
    console.log(`Total Records Read : ${summary.totalRead}`);
    console.log(`Created (New)      : ${summary.created}`);
    console.log(`Updated (Existing) : ${summary.updated}`);
    console.log(`Skipped            : ${summary.skipped}`);
    console.log(`Validation Errors  : ${summary.invalid}`);
    console.log(`Conflicts / Review : ${summary.conflicts}`);
    console.log(`Execution Time     : ${summary.durationMs}ms`);
    console.log("==================================================");

    if (summary.invalid > 0 || summary.conflicts > 0) {
      console.log("\nAttention Items:");
      for (const rec of summary.records) {
        if (rec.status === "invalid") {
          console.log(`  ❌ [INVALID] ${rec.schemeName}: ${rec.errors?.join(", ")}`);
        } else if (rec.status === "conflict") {
          console.log(`  ⚠️ [CONFLICT] ${rec.schemeName}: ${rec.reasons.join(", ")}`);
        }
      }
    }
  } catch (err: any) {
    console.error("Ingestion failed with error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase disconnected. Ingestion session closed.");
  }
}

if (require.main === module) {
  runCli();
}
