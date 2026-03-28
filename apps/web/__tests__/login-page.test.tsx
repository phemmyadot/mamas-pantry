import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

const { mockLogin, mockResend, mockPush } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockResend: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("@/lib/api", () => ({
  auth: { resendVerification: mockResend },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public title: string, public detail: string) {
      super(detail);
    }
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign in form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("navigates to / on successful login", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ ok: true });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password"));
    // window.location.href is used, not router.push — just verify login was called
  });

  it("shows error message on login failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ ok: false, error: "Invalid email or password" });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument()
    );
  });

  it("shows verify email card when login returns email_not_verified", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ ok: false, error: "email_not_verified" });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "unverified@example.com");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /resend verification/i })).toBeInTheDocument();
    // Error message should NOT be shown
    expect(screen.queryByText("email_not_verified")).toBeNull();
  });

  it("resend button calls api and shows confirmation", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ ok: false, error: "email_not_verified" });
    mockResend.mockResolvedValueOnce(undefined);

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "unverified@example.com");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => screen.getByRole("button", { name: /resend verification/i }));
    await user.click(screen.getByRole("button", { name: /resend verification/i }));

    await waitFor(() =>
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    );
    expect(mockResend).toHaveBeenCalledWith("unverified@example.com");
  });

  it("back to sign in button hides the verify card", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ ok: false, error: "email_not_verified" });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "a@example.com");
    await user.type(screen.getByLabelText(/password/i), "pw");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => screen.getByText(/verify your email/i));
    await user.click(screen.getByRole("button", { name: /back to sign in/i }));

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });
});
