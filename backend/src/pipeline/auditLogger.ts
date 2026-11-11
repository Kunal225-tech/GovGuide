import fs from "fs";
import path from "path";
import { IngestionSummary, IngestionRecordResult } from "./types";

export class AuditLogger {
  private startTime: number;
  private results: IngestionRecordResult[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  record(result: IngestionRecordResult): void {
    this.results.push(result);
  }

  getSummary(): IngestionSummary {
    const durationMs = Date.now() - this.startTime;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let invalid = 0;
    let conflicts = 0;

    for (const r of this.results) {
      if (r.status === "created") created++;
      else if (r.status === "updated") updated++;
      else if (r.status === "skipped") skipped++;
      else if (r.status === "invalid") invalid++;
      else if (r.status === "conflict") conflicts++;
    }

    return {
      totalRead: this.results.length,
      created,
      updated,
      skipped,
      invalid,
      conflicts,
      records: this.results,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }

  async saveToFile(logDir?: string): Promise<string> {
    const summary = this.getSummary();
    const targetDir = logDir || path.resolve(process.cwd(), "data/logs");

    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(targetDir, `ingestion-${timestampStr}.json`);

    await fs.promises.writeFile(filePath, JSON.stringify(summary, null, 2), "utf-8");
    return filePath;
  }
}
