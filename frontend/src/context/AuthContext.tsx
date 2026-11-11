// AuthContext.tsx -- Centralized authentication state for GovGuide.
//
// Provides:
//   - user / token / isAuthenticated / loading
//   - login(token, user) -- called by LoginPage after successful API call
//   - logout()           -- clears storage and redirects to /login
//
// JWT is persisted in localStorage under "token".
// The user object is persisted under "user" (JSON).
//
// On mount the context validates the stored JWT by checking its expiry
// (exp claim in the payload). If the token is missing or expired the
// auth state is cleared so the rest of the app sees isAuthenticated=false.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@/types/user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** Call after a successful /api/auth/login response */
  login: (token: string, user: User) => void;
  /** Clears auth state + localStorage and navigates to /login */
  logout: () => void;
  /** Updates user in AuthContext and localStorage */
  updateUser: (newUser: User) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** Returns true when the JWT exp claim is in the future (or absent). */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp !== 'number') return true; // no exp → treat as valid
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function readStoredAuth(): { token: string | null; user: User | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);

  if (!token || !isTokenValid(token)) {
    // Stale / expired -- clean up eagerly
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token: null, user: null };
  }

  let user: User | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as User;
    } catch {
      user = null;
    }
  }
  return { token, user };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredAuth().token);
  const [user, setUser] = useState<User | null>(() => readStoredAuth().user);
  const [loading] = useState(false);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    // Hard-navigate so all component state is reset
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((newUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  // Sync latest user profile on mount if token is present
  useEffect(() => {
    if (!token) return;
    fetch('/api/profile', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      })
      .catch(() => {
        // silent fallback
      });
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      logout,
      updateUser,
    }),
    [user, token, loading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
