// profileApi.ts -- Centralized API layer for profile-related HTTP calls.
//
// Both endpoints require authentication (JWT in Authorization header).
// Token is stored in localStorage under the key "token" (set by LoginPage.tsx).

import type {
  GetProfileResponse,
  UpdateProfileResponse,
  UpdateProfilePayload,
  User,
} from "@/types/user";

const BASE = "/api/profile";

// Helper: reads JWT from localStorage and builds the Authorization header.
// Throws an AuthError if no token is found.
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AuthError("You must be logged in to view your profile.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Custom error so the UI can show a "please log in" message separately.
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// --------------------------------------------------------
// GET /api/profile
// Returns the authenticated user's full profile.
// --------------------------------------------------------
export async function getProfile(): Promise<User> {
  const response = await fetch(BASE, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    throw new AuthError("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status} ${response.statusText}`);
  }

  const json: GetProfileResponse = await response.json();
  return json.user;
}

// --------------------------------------------------------
// PUT /api/profile
// Updates the authenticated user's profile fields.
// Returns the updated user.
// --------------------------------------------------------
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await fetch(BASE, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AuthError("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`Failed to save profile: ${response.status} ${response.statusText}`);
  }

  const json: UpdateProfileResponse = await response.json();
  return json.user;
}
