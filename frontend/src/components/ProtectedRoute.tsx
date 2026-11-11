// ProtectedRoute.tsx -- Guards routes that require authentication.
//
// Usage in App.tsx:
//   { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> }
//
// Behaviour:
//   - While auth is initialising (loading=true): renders a full-page spinner
//     so the user never sees a flash of content or a spurious redirect.
//   - If authenticated: renders children normally.
//   - If not authenticated: redirects to /login, preserving the attempted
//     URL in location.state.from so LoginPage can redirect back after login.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
}
