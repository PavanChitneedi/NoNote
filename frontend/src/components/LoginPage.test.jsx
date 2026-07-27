import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext.jsx";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import LoginPage from "./LoginPage.jsx";

vi.mock("../api/client.js", () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  hasRefreshToken: vi.fn(() => false),
}));

const { login: apiLogin } = await import("../api/client.js");

function renderLoginPage() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders email and password fields and a submit button", () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("lets the user type into email and password fields", () => {
    renderLoginPage();
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(emailInput, { target: { value: "a@b.com" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    expect(emailInput.value).toBe("a@b.com");
    expect(passwordInput.value).toBe("secret123");
  });

  it("calls login() with the entered credentials on submit", async () => {
    apiLogin.mockResolvedValue({
      access_token: "a", refresh_token: "r",
      user: { id: "u1", email: "a@b.com", display_name: "A", role: "editor" },
    });
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(apiLogin).toHaveBeenCalledWith("a@b.com", "secret123"));
  });

  it("shows the error message and clears the loading state when login fails", async () => {
    apiLogin.mockRejectedValue(new Error("Invalid credentials"));
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    // Button must return to its normal (non-loading) state after the failure
    expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
  });

  it("disables the submit button while the login request is in flight", async () => {
    let resolveLogin;
    apiLogin.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("button", { name: /signing in/i })).toBeDisabled();

    resolveLogin({ access_token: "a", refresh_token: "r", user: { id: "u1", email: "a@b.com", role: "editor" } });
    await waitFor(() => expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled());
  });

  it("renders one theme-switcher swatch per theme and switches the active theme on click", () => {
    renderLoginPage();
    // ThemeContext defaults to "arctic" — body.dataset.theme reflects the active theme
    expect(document.body.dataset.theme).toBe("arctic");

    const midnightSwatch = screen.getByTitle("Midnight");
    fireEvent.click(midnightSwatch);

    expect(document.body.dataset.theme).toBe("midnight");
  });
});
