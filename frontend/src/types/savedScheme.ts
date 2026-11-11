import type { Scheme } from "./scheme";

export interface SavedSchemeItem {
  _id: string;
  schemeId: string;
  scheme: Scheme;
  status: "saved" | "in-progress" | "in-progess" | "submitted" | "approved" | "rejected";
  savedAt: string;
}

export interface SavedSchemesResponse {
  success: boolean;
  count: number;
  data: SavedSchemeItem[];
}
