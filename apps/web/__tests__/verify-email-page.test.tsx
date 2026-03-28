import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";

const { mockVerifyEmail } = vi.hoisted(() => ({ mockVerifyEmail: vi.fn() }));

vi.mock("@/lib/api", () => ({
  auth: { verifyEmail: mockVerifyEmail },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public title: string, public detail: string) {
      super(detail);
    }
  },
}));

// Override useSearchParams per test
let mockToken = "valid-token";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`token=${mockToken}`),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/verify-email",
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = "valid-token";
  });

  it("shows pending state initially", () => {
    mockVerifyEmail.mockReturnValueOnce(new Promise(() => {})); // never resolves
    render(<VerifyEmailPage />);
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it("shows success state after verification", async () => {
    mockVerifyEmail.mockResolvedValueOnce({ detail: "Email verified successfully" });

    render(<VerifyEmailPage />);
    await waitFor(() =>
      expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error state when token is invalid", async () => {
    const { ApiError } = await import("@/lib/api");
    mockVerifyEmail.mockRejectedValueOnce(
      new ApiError(400, "Bad Request", "Invalid or expired verification token")
    );

    render(<VerifyEmailPage />);
    await waitFor(() =>
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument()
    );
    expect(screen.getByText("Invalid or expired verification token")).toBeInTheDocument();
  });

  it("shows 'already used' heading when link was already used", async () => {
    const { ApiError } = await import("@/lib/api");
    mockVerifyEmail.mockRejectedValueOnce(
      new ApiError(400, "Bad Request", "This verification link has already been used. Please sign in.")
    );

    render(<VerifyEmailPage />);
    await waitFor(() =>
      expect(screen.getByText(/link already used/i)).toBeInTheDocument()
    );
  });

  it("shows error when no token in URL", async () => {
    mockToken = "";
    render(<VerifyEmailPage />);
    await waitFor(() =>
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/no verification token/i)).toBeInTheDocument();
  });
});
