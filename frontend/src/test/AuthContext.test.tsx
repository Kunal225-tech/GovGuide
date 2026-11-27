import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { mockUser } from "./mocks/handlers";

function AuthConsumer() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "authenticated" : "guest"}</span>
      <span data-testid="auth-token">{token ?? "none"}</span>
      <span data-testid="auth-user">{user?.name ?? "none"}</span>
      <span data-testid="auth-district">{user?.profile?.district ?? "none"}</span>
      <button
        type="button"
        onClick={() =>
          login(
            "header.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0.sig",
            mockUser
          )
        }
      >
        DoLogin
      </button>
      <button type="button" onClick={() => logout()}>
        DoLogout
      </button>
      <button
        type="button"
        onClick={() =>
          updateUser({
            ...mockUser,
            profile: { ...mockUser.profile, district: "Nalanda" },
          })
        }
      >
        DoUpdate
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts unauthenticated and clears expired stored JWT on mount", () => {
    const expiredPayload = btoa(JSON.stringify({ userId: "u1", exp: 1000 }));
    localStorage.setItem("token", `hdr.${expiredPayload}.sig`);
    localStorage.setItem("user", JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("login stores token and user in localStorage and marks authenticated", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");

    await act(async () => {
      screen.getByRole("button", { name: "DoLogin" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("auth-user")).toHaveTextContent("Ravi Kumar");
    expect(localStorage.getItem("token")).toContain("header.");
  });

  it("logout clears localStorage and resets auth state", async () => {
    const validPayload = btoa(JSON.stringify({ userId: "u1", exp: 9999999999 }));
    localStorage.setItem("token", `hdr.${validPayload}.sig`);
    localStorage.setItem("user", JSON.stringify(mockUser));

    const originalLocation = window.location;
    let assignedHref = "";
    const mockLocation = {
      ...originalLocation,
      get href() {
        return originalLocation.href;
      },
      set href(val: string) {
        assignedHref = val;
      },
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: mockLocation,
    });

    try {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Let initial /api/profile sync settle before triggering logout
      await waitFor(() => {
        expect(screen.getByTestId("auth-district")).toHaveTextContent("Patna");
      });
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");

      await act(async () => {
        screen.getByRole("button", { name: "DoLogout" }).click();
      });

      expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(assignedHref).toBe("/login");
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it("updateUser updates context state and localStorage", async () => {
    const validPayload = btoa(JSON.stringify({ userId: "u1", exp: 9999999999 }));
    localStorage.setItem("token", `hdr.${validPayload}.sig`);
    localStorage.setItem("user", JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Wait for initial /api/profile mount sync to settle before updating user
    await waitFor(() => {
      expect(screen.getByTestId("auth-district")).toHaveTextContent("Patna");
    });

    await act(async () => {
      screen.getByRole("button", { name: "DoUpdate" }).click();
    });

    expect(screen.getByTestId("auth-district")).toHaveTextContent("Nalanda");
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    expect(stored.profile.district).toBe("Nalanda");
  });

  it("throws descriptive error when useAuth is called outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow(
      /useAuth must be used within an AuthProvider/i
    );
    spy.mockRestore();
  });
});
