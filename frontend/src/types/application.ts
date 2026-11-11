import type { Scheme } from "./scheme";

export type ApplicationStatus =
  | "saved"
  | "in-progress"
  | "submitted"
  | "approved"
  | "rejected";

export interface ApplicationItem {
  _id: string;
  schemeId: string;
  scheme: Scheme;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationsResponse {
  success: boolean;
  count: number;
  data: ApplicationItem[];
}

export interface SingleApplicationResponse {
  success: boolean;
  message: string;
  data: ApplicationItem;
}

export interface UpdateApplicationPayload {
  status?: ApplicationStatus;
  notes?: string;
  appliedAt?: string;
}

export interface CreateApplicationPayload {
  schemeId: string;
  status?: ApplicationStatus;
  notes?: string;
  appliedAt?: string;
}
