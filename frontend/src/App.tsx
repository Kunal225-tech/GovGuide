import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { SchemesPage } from './pages/SchemesPage';
import { SchemeDetailsPage } from './pages/SchemeDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { EligiblePage } from './pages/EligiblePage';
import { SavedSchemesPage } from './pages/SavedSchemesPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'how-it-works', element: <HowItWorksPage /> },
      { path: 'about', element: <AboutPage /> },
      // --- Protected Scheme Discovery & Citizen Routes ---
      {
        path: 'schemes',
        element: (
          <ProtectedRoute>
            <SchemesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'schemes/:id',
        element: (
          <ProtectedRoute>
            <SchemeDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'eligible',
        element: (
          <ProtectedRoute>
            <EligiblePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'saved',
        element: (
          <ProtectedRoute>
            <SavedSchemesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'applications',
        element: (
          <ProtectedRoute>
            <ApplicationsPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
