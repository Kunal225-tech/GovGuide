// savedSchemeApi.ts -- Centralized API layer for Saved Schemes operations
import type { SavedSchemeItem, SavedSchemesResponse } from "@/types/savedScheme";

const BASE = "/api/saved";

export class AuthError extends Error {
  constructor(message: string = "You must be logged in to access saved schemes.") {
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
 * Fetch all saved schemes for the authenticated user.
 * GET /api/saved
 */
export async function getSavedSchemes(): Promise<SavedSchemeItem[]> {
  const response = await fetch(BASE, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new AuthError("Session expired or invalid. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch saved schemes (${response.status})`);
  }

  const result: SavedSchemesResponse = await response.json();
  return result.data || [];
}

/**
 * Save a scheme for the authenticated user.
 * POST /api/saved
 */
export async function saveScheme(schemeId: string): Promise<void> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ schemeId }),
  });

  if (response.status === 401) {
    throw new AuthError("You must be logged in to save schemes.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to save scheme (${response.status})`);
  }
}

/**
 * Remove (unsave) a scheme for the authenticated user.
 * DELETE /api/saved/:schemeId
 */
export async function unsaveScheme(schemeId: string): Promise<void> {
  const response = await fetch(`${BASE}/${schemeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new AuthError("You must be logged in to modify saved schemes.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to unsave scheme (${response.status})`);
  }
}
