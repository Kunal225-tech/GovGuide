import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SavedSchemesProvider } from "@/context/SavedSchemesContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LoginPage } from "@/pages/LoginPage";
import { EligiblePage } from "@/pages/EligiblePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SchemesPage } from "@/pages/SchemesPage";
import { mockUser } from "./mocks/handlers";

function renderPage(ui: React.ReactElement, initialEntries = ["/"]) {
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

function seedAuthenticatedUser() {
  const validPayload = btoa(JSON.stringify({ userId: "user-123", exp: 9999999999 }));
  localStorage.setItem("token", `hdr.${validPayload}.sig`);
  localStorage.setItem("user", JSON.stringify(mockUser));
}

describe("Key Application Pages", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("LoginPage validates empty and malformed inputs before submission", async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage />, ["/login"]);

    await user.click(screen.getByRole("button", { name: /Sign In to Portal/i }));

    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Email Address/i), "bad-email");
    await user.type(screen.getByLabelText(/^Password/i), "123456");
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/i }));

    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  it("LoginPage authenticates valid credentials and navigates to /profile", async () => {
    const user = userEvent.setup();
    renderPage(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<div>Profile Dashboard Page</div>} />
      </Routes>,
      ["/login"]
    );

    await user.type(screen.getByLabelText(/Email Address/i), "ravi@example.com");
    await user.type(screen.getByLabelText(/^Password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/i }));

    expect(await screen.findByText("Profile Dashboard Page")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeTruthy();
  });

  it("LoginPage displays server error on invalid credentials and switches to Mobile OTP notice", async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage />, ["/login"]);

    await user.type(screen.getByLabelText(/Email Address/i), "ravi@example.com");
    await user.type(screen.getByLabelText(/^Password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Invalid email or password/i);

    await user.click(screen.getByRole("tab", { name: /Mobile OTP/i }));
    expect(
      screen.getByText(/Mobile OTP gateway is in sandbox mode/i)
    ).toBeInTheDocument();
  });

  it("EligiblePage renders eligible, unverified, and ineligible scheme groups", async () => {
    seedAuthenticatedUser();
    renderPage(<EligiblePage />, ["/eligible"]);

    expect(
      await screen.findByRole("heading", { name: /Criteria Met/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Bihar Student Credit Card Scheme")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Needs Verification \/ Insufficient Data/i })
    ).toBeInTheDocument();
    expect(screen.getByText("PM-KISAN Samman Nidhi")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Criteria Not Met/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Mukhyamantri Kanya Utthan Yojana")).toBeInTheDocument();
  });

  it("ProfilePage loads user demographics and submits updates cleanly", async () => {
    seedAuthenticatedUser();
    const user = userEvent.setup();
    renderPage(<ProfilePage />, ["/profile"]);

    const ageInput = await screen.findByLabelText(/Age/i);
    expect(ageInput).toHaveValue(21);

    await user.clear(ageInput);
    await user.type(ageInput, "24");

    const saveBtn = screen.getByRole("button", { name: /Save Profile/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue("24")).toBeInTheDocument();
    });
  });

  it("SchemesPage loads schemes and filters results by search query", async () => {
    const user = userEvent.setup();
    renderPage(<SchemesPage />, ["/schemes"]);

    expect(await screen.findByText("Bihar Student Credit Card Scheme")).toBeInTheDocument();
    expect(screen.getByText("PM-KISAN Samman Nidhi")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by scheme name/i);
    await user.type(searchInput, "Kanya");

    await waitFor(() => {
      expect(screen.getByText("Mukhyamantri Kanya Utthan Yojana")).toBeInTheDocument();
      expect(screen.queryByText("PM-KISAN Samman Nidhi")).not.toBeInTheDocument();
    });
  });
});
