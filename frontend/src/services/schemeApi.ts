// schemeApi.ts -- Centralized API layer for all scheme-related HTTP calls.
//
// WHY A SEPARATE FILE?
// Instead of writing fetch() inside every component, we keep all API logic here.
// If the endpoint ever changes, we only update ONE place.
// Components stay clean -- they just call getSchemes() and getSchemeById().

import type { Scheme, SchemesApiResponse, SchemeByIdApiResponse } from "@/types/scheme";

// The base path for schemes API.
// Vite proxy (vite.config.ts) forwards /api/* to http://localhost:5000
const BASE = "/api/schemes";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches all government schemes from the backend.
 * Returns a typed array of Scheme objects.
 *
 * Throws an Error if the network request fails or the server returns an error.
 */
export async function getSchemes(): Promise<Scheme[]> {
  const response = await fetch(BASE, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    // response.ok is true for 200-299 status codes.
    // If the server returned 500 or 404, we throw an error so the caller can handle it.
    throw new Error(`Failed to fetch schemes: ${response.status} ${response.statusText}`);
  }

  // Parse the JSON body. We tell TypeScript what shape to expect.
  const json: SchemesApiResponse = await response.json();

  if (!json.success) {
    throw new Error("Server returned success: false while fetching schemes");
  }

  return json.data;
}

/**
 * Fetches a single scheme by its MongoDB _id.
 * Returns a single Scheme object, or throws if not found.
 */
export async function getSchemeById(id: string): Promise<Scheme> {
  const response = await fetch(`${BASE}/${id}`, {
    headers: getAuthHeaders(),
  });

  // 404 means the scheme doesn't exist in the DB — give a friendlier error
  if (response.status === 404) {
    throw new NotFoundError("Scheme not found. It may have been removed or the link is invalid.");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch scheme: ${response.status} ${response.statusText}`);
  }

  const json: SchemeByIdApiResponse = await response.json();

  if (!json.success) {
    throw new Error("Server returned success: false while fetching scheme by ID");
  }

  return json.data;
}

// Custom error class so the UI can distinguish 404 from general errors.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
