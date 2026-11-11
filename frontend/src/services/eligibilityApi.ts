// eligibilityApi.ts -- Centralized API layer for the eligibility endpoint.
//
// GET /api/eligibility
//   - Requires authentication (JWT via Authorization header).
//   - Runs the deterministic eligibility engine on the server.
//   - Returns { results: EligibilityResult[] }.
//
// The frontend NEVER calculates eligibility. All logic stays on the backend.

import type { EligibilityResult, EligibilityApiResponse } from '@/types/eligibility';
import { AuthError } from '@/services/profileApi';

const BASE = '/api/eligibility';

/**
 * Fetches eligibility results for the authenticated user.
 * Reads the JWT from localStorage (same key used by AuthContext / LoginPage).
 *
 * Throws:
 *   AuthError   -- token missing or server returned 401
 *   Error       -- any other network / server failure
 */
export async function getEligibility(): Promise<EligibilityResult[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new AuthError('You must be logged in to check eligibility.');
  }

  const response = await fetch(BASE, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new AuthError('Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch eligibility results: ${response.status} ${response.statusText}`
    );
  }

  const json: EligibilityApiResponse = await response.json();
  return json.results;
}
