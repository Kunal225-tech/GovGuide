import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { mockUser } from "./mocks/handlers";
import { AuthProvider } from "@/context/AuthContext";
import { SavedSchemesProvider } from "@/context/SavedSchemesContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { FeaturedSchemes } from "@/components/home/FeaturedSchemes";
import { SaveButton } from "@/components/SaveButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function renderWithProviders(ui: React.ReactElement, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <SavedSchemesProvider>{ui}</SavedSchemesProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("Core UI Components", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Navbar renders primary navigation links and Sign In / Register for guests", () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByText(/GovGuide/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Schemes/i })).toHaveAttribute("href", "/schemes");
    expect(screen.getByRole("link", { name: /Check Eligibility/i })).toHaveAttribute("href", "/eligible");
    expect(screen.getByRole("link", { name: /^Login$/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /^Sign Up$/i })).toHaveAttribute("href", "/register");
  });

  it("Navbar displays authenticated user's name and account menu", async () => {
    const validPayload = btoa(JSON.stringify({ userId: "user-123", exp: 9999999999 }));
    localStorage.setItem("token", `hdr.${validPayload}.sig`);
    localStorage.setItem("user", JSON.stringify(mockUser));

    const user = userEvent.setup();
    renderWithProviders(<Navbar />);

    const profileBtn = await screen.findByRole("button", { name: /My Profile/i });
    expect(profileBtn).toHaveTextContent("Ravi Kumar");

    await user.click(profileBtn);
    expect(screen.getByRole("menu", { name: /Account menu/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Logout/i })).toBeInTheDocument();
  });

  it("FeaturedSchemes fetches and renders Bihar scheme cards with badges", async () => {
    renderWithProviders(<FeaturedSchemes />);

    expect(await screen.findByText("Bihar Student Credit Card Scheme")).toBeInTheDocument();
    expect(screen.getByText("Mukhyamantri Kanya Utthan Yojana")).toBeInTheDocument();
    expect(screen.getByText(/7 Nischay/i)).toBeInTheDocument();
  });

  it("FeaturedSchemes renders fallback CTA when API returns empty list", async () => {
    server.use(
      http.get("/api/schemes", () => {
        return HttpResponse.json({ success: true, count: 0, data: [] });
      })
    );

    renderWithProviders(<FeaturedSchemes />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /Browse All Schemes/i }).length).toBeGreaterThanOrEqual(2);
    });
  });

  it("SaveButton redirects unauthenticated user to /login", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<SaveButton schemeId="scheme-bsccs-1" schemeName="BSCCS" />} />
        <Route path="/login" element={<div>Login Destination</div>} />
      </Routes>
    );

    await user.click(screen.getByRole("button", { name: /BSCCS/i }));
    expect(await screen.findByText("Login Destination")).toBeInTheDocument();
  });

  it("ProtectedRoute redirects guests to /login and renders children for signed-in users", () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div>Secret Profile Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Redirected To Login</div>} />
      </Routes>,
      ["/profile"]
    );
    expect(screen.getByText("Redirected To Login")).toBeInTheDocument();

    const validPayload = btoa(JSON.stringify({ userId: "user-123", exp: 9999999999 }));
    localStorage.setItem("token", `hdr.${validPayload}.sig`);
    localStorage.setItem("user", JSON.stringify(mockUser));

    renderWithProviders(
      <Routes>
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div>Secret Profile Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Redirected To Login</div>} />
      </Routes>,
      ["/profile"]
    );
    expect(screen.getByText("Secret Profile Content")).toBeInTheDocument();
  });
});
