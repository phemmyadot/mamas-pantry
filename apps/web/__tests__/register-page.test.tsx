import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";

const { mockRegister } = vi.hoisted(() => ({ mockRegister: vi.fn() }));
vi.mock("@/lib/api", () => ({
  auth: { register: mockRegister },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public title: string, public detail: string) {
      super(detail);
    }
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows success card after successful registration", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({
      id: "u1",
      email: "new@example.com",
      username: null,
      is_active: true,
      is_verified: false,
    });

    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/email address/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    );
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).toBeNull();
  });

  it("shows error on registration failure", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api");
    mockRegister.mockRejectedValueOnce(
      new ApiError(400, "Bad Request", "Email already registered")
    );

    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/email address/i), "dup@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText("Email already registered")).toBeInTheDocument()
    );
  });

  it("disables button while pending", async () => {
    let resolve: (v: unknown) => void = () => {};
    mockRegister.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();

    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/email address/i), "a@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    resolve({});
  });
});
