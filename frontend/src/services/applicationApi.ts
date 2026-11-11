// applicationApi.ts -- Centralized API layer for Scheme Application Tracking
import type {
  ApplicationItem,
  ApplicationsResponse,
  SingleApplicationResponse,
  UpdateApplicationPayload,
  CreateApplicationPayload,
} from "@/types/application";

const BASE = "/api/applications";

export class AuthError extends Error {
  constructor(message: string = "You must be logged in to view applications.") {
    super(message);
    this.name = "AuthError";
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AuthError();
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetch all tracked applications for the authenticated user.
 * GET /api/applications?status=...
 */
export async function getApplications(status?: string): Promise<ApplicationItem[]> {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${BASE}${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new AuthError("Session expired or invalid. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch applications (${response.status})`);
  }

  const result: ApplicationsResponse = await response.json();
  return result.data || [];
}

/**
 * Update an application tracking record (status, notes, date).
 * PUT /api/applications/:id
 */
export async function updateApplication(
  id: string,
  payload: UpdateApplicationPayload
): Promise<ApplicationItem> {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AuthError("You must be logged in to update applications.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update application (${response.status})`);
  }

  const result: SingleApplicationResponse = await response.json();
  return result.data;
}

/**
 * Track a new scheme application or update existing.
 * POST /api/applications
 */
export async function createApplication(
  payload: CreateApplicationPayload
): Promise<ApplicationItem> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AuthError("You must be logged in to track applications.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to track application (${response.status})`);
  }

  const result: SingleApplicationResponse = await response.json();
  return result.data;
}

/**
 * Delete an application tracking record.
 * DELETE /api/applications/:id
 */
export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new AuthError("You must be logged in to modify applications.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete application record (${response.status})`);
  }
}
