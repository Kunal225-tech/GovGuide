import fs from "fs";
import path from "path";
import { SourceAdapter } from "./baseAdapter";
import { RawSchemeInput } from "../types";

export interface JsonAdapterOptions {
  filePath?: string;
  jsonData?: any;
  jsonString?: string;
  sourcePlatform?: string;
  maxSizeBytes?: number; // Default: 10MB
}

/**
 * Adapter to ingest scheme data from JSON files, objects, or strings.
 */
export class JsonAdapter implements SourceAdapter {
  readonly adapterName = "JsonAdapter";
  readonly sourcePlatform: string;
  private filePath?: string;
  private jsonData?: any;
  private jsonString?: string;
  private maxSizeBytes: number;

  constructor(options: JsonAdapterOptions) {
    this.filePath = options.filePath;
    this.jsonData = options.jsonData;
    this.jsonString = options.jsonString;
    this.sourcePlatform = options.sourcePlatform || "local-json";
    this.maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB
  }

  async load(): Promise<RawSchemeInput[]> {
    let parsed: any = this.jsonData;

    if (!parsed && this.jsonString) {
      try {
        parsed = JSON.parse(this.jsonString);
      } catch (err: any) {
        throw new Error(`Malformed JSON string: ${err.message}`);
      }
    } else if (!parsed && this.filePath) {
      const resolvedPath = path.resolve(this.filePath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`JSON file not found at path: ${this.filePath}`);
      }

      const stats = await fs.promises.stat(resolvedPath);
      if (stats.size > this.maxSizeBytes) {
        throw new Error(
          `JSON file size (${stats.size} bytes) exceeds maximum permitted limit of ${this.maxSizeBytes} bytes.`
        );
      }

      const rawContent = await fs.promises.readFile(resolvedPath, "utf-8");
      try {
        parsed = JSON.parse(rawContent);
      } catch (err: any) {
        throw new Error(`Malformed JSON in file '${this.filePath}': ${err.message}`);
      }
    }

    if (!parsed) {
      return [];
    }

    // Extract schemes array from top-level or wrapper object
    let items: any[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.schemes)) {
        items = parsed.schemes;
      } else if (Array.isArray(parsed.data)) {
        items = parsed.data;
      } else {
        // Single scheme object
        items = [parsed];
      }
    }

    return items.map((item) => ({
      ...item,
      sourcePlatform: item.sourcePlatform || this.sourcePlatform,
    }));
  }
}
