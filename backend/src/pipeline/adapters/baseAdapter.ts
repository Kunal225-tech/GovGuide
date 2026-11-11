import { RawSchemeInput } from "../types";

/**
 * Standard interface for all data source adapters in the pipeline.
 */
export interface SourceAdapter {
  readonly adapterName: string;
  readonly sourcePlatform: string;
  load(): Promise<RawSchemeInput[]>;
}
