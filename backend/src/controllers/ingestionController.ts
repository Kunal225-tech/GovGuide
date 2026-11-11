import { Request, Response } from "express";
import path from "path";
import { JsonAdapter } from "../pipeline/adapters/jsonAdapter";
import { CsvAdapter } from "../pipeline/adapters/csvAdapter";
import { IngestionService } from "../pipeline/services/ingestionService";
import { IngestionOptions } from "../pipeline/types";

const MAX_API_RECORDS = 1000;

function isPathSafe(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const cwd = path.resolve(process.cwd());
  // Path must be within project directory or parent data directory
  return resolved.startsWith(cwd) || resolved.includes("data");
}

export class IngestionController {
  /**
   * Admin Endpoint: Ingest scheme records from JSON
   * POST /api/admin/ingest/json
   */
  static async ingestJson(req: Request, res: Response): Promise<void> {
    try {
      const { filePath, schemes, jsonString, options = {} } = req.body;

      if (!filePath && !schemes && !jsonString) {
        res.status(400).json({
          success: false,
          message:
            "Please provide 'schemes' (array of scheme objects), 'jsonString', or 'filePath'.",
        });
        return;
      }

      if (filePath && !isPathSafe(filePath)) {
        res.status(403).json({
          success: false,
          message: "Unsafe file path rejected.",
        });
        return;
      }

      if (Array.isArray(schemes) && schemes.length > MAX_API_RECORDS) {
        res.status(400).json({
          success: false,
          message: `Payload exceeds maximum permitted limit of ${MAX_API_RECORDS} records per request.`,
        });
        return;
      }

      const adapter = new JsonAdapter({
        filePath,
        jsonData: schemes,
        jsonString,
        sourcePlatform: (options as IngestionOptions).defaultSourcePlatform || "admin-api-json",
      });

      const summary = await IngestionService.ingest(adapter, options);

      res.status(200).json({
        success: true,
        message: "JSON scheme ingestion completed.",
        summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process JSON ingestion.",
      });
    }
  }

  /**
   * Admin Endpoint: Ingest scheme records from CSV
   * POST /api/admin/ingest/csv
   */
  static async ingestCsv(req: Request, res: Response): Promise<void> {
    try {
      const { filePath, csvContent, options = {} } = req.body;

      if (!filePath && !csvContent) {
        res.status(400).json({
          success: false,
          message: "Please provide 'csvContent' (CSV string) or 'filePath'.",
        });
        return;
      }

      if (filePath && !isPathSafe(filePath)) {
        res.status(403).json({
          success: false,
          message: "Unsafe file path rejected.",
        });
        return;
      }

      const adapter = new CsvAdapter({
        filePath,
        csvContent,
        sourcePlatform: (options as IngestionOptions).defaultSourcePlatform || "admin-api-csv",
      });

      const summary = await IngestionService.ingest(adapter, options);

      res.status(200).json({
        success: true,
        message: "CSV scheme ingestion completed.",
        summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process CSV ingestion.",
      });
    }
  }
}
