// This interface mirrors the Scheme Mongoose model in the backend (backend/src/models/Scheme.ts).
// It describes the shape of ONE scheme object that the API returns.
// TypeScript will use this to validate our data at compile time.

export interface Scheme {
  _id: string;          // MongoDB document ID (string, not ObjectId on the frontend)
  name: string;
  description: string;
  category: string;
  level: "central" | "state"; // Union type -- only these two values are valid
  state?: string;             // Optional -- only present for state-level schemes
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialUrl: string;
  source: string;
  // Phase 1 Additive Fields (Optional & Backward Compatible)
  schemeType?: "central-sector" | "centrally-sponsored" | "state" | "ut";
  applicableStates?: string[];
  sourcePlatform?: string;
  sourceId?: string;
  verificationStatus?: "verified" | "unverified" | "needs-review";
  verifiedAt?: string;
  applicationUrl?: string;
  status?: "active" | "discontinued" | "under-review";
  hasDeterministicRule?: boolean;
  // Phase B Provenance Fields (Optional & Backward Compatible)
  aliases?: string[];
  exclusions?: string[];
  officialDocUrl?: string;
  sourceDocumentTitle?: string;
  verifiedBy?: string;
  unresolvedQuestions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// This describes the shape of the API response from GET /api/schemes.
// The controller sends: { success: true, count: N, data: [...schemes] }
export interface SchemesApiResponse {
  success: boolean;
  count: number;
  data: Scheme[];
}

// This describes the shape of the API response from GET /api/schemes/:id
export interface SchemeByIdApiResponse {
  success: boolean;
  data: Scheme;
}
