import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const { mockMe, mockLogin, mockLogout, mockSetCookie, mockDeleteCookie } = vi.hoisted(() => ({
  mockMe: vi.fn(),
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockSetCookie: vi.fn(),
  mockDeleteCookie: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  auth: {
    me: mockMe,
    login: mockLogin,
    logout: mockLogout,
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public title: string, public detail: string) {
      super(detail);
    }
  },
  setCookie: mockSetCookie,
  deleteCookie: mockDeleteCookie,
}));

function DisplayAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <span data-testid="loading">loading</span>;
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? "none"}</span>
    </div>
  );
}

function LoginButton() {
  const { login } = useAuth();
  return (
    <button
      onClick={async () => {
        const result = await login("test@example.com", "password");
        if (!result.ok) document.title = result.error;
      }}
    >
      login
    </button>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>logout</button>;
}

function renderAuth(children = <DisplayAuth />) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, "cookie", { writable: true, value: "" });
  });

  it("starts unauthenticated when no cookie present", async () => {
    renderAuth();
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("calls auth.me when access cookie is present", async () => {
    Object.defineProperty(document, "cookie", { writable: true, value: "mp_access=sometoken" });
    mockMe.mockResolvedValueOnce({
      id: "u1", email: "user@example.com", username: "user",
      is_active: true, is_verified: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), roles: [],
    });

    renderAuth();
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    expect(mockMe).toHaveBeenCalledOnce();
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("email").textContent).toBe("user@example.com");
  });

  it("calls auth.me when only refresh cookie is present", async () => {
    Object.defineProperty(document, "cookie", { writable: true, value: "mp_refresh=refresh-token" });
    mockMe.mockResolvedValueOnce({
      id: "u1", email: "user@example.com", username: "user",
      is_active: true, is_verified: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), roles: [],
    });

    renderAuth();
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    expect(mockMe).toHaveBeenCalledOnce();
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
  });

  it("stays unauthenticated when auth.me throws", async () => {
    Object.defineProperty(document, "cookie", { writable: true, value: "mp_access=badtoken" });
    mockMe.mockRejectedValueOnce(new Error("401"));

    renderAuth();
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("login success sets user and tokens", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ access_token: "access", refresh_token: "refresh", token_type: "bearer" });
    mockMe.mockResolvedValueOnce({
      id: "u1", email: "test@example.com", username: null,
      is_active: true, is_verified: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), roles: [],
    });

    render(<AuthProvider><DisplayAuth /><LoginButton /></AuthProvider>);
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    await user.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("true"));
    expect(mockSetCookie).toHaveBeenCalledWith("mp_access", "access", expect.any(Number));
    expect(mockSetCookie).toHaveBeenCalledWith("mp_refresh", "refresh", expect.any(Number));
  });

  it("login failure returns error message", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api");
    mockLogin.mockRejectedValueOnce(new ApiError(401, "Unauthorized", "Invalid email or password"));

    render(<AuthProvider><LoginButton /></AuthProvider>);
    await user.click(screen.getByText("login"));
    await waitFor(() => expect(document.title).toBe("Invalid email or password"));
  });

  it("logout clears cookies and user state", async () => {
    const user = userEvent.setup();
    Object.defineProperty(document, "cookie", { writable: true, value: "mp_access=tok; mp_refresh=ref" });
    mockMe.mockResolvedValueOnce({
      id: "u1", email: "user@example.com", username: null,
      is_active: true, is_verified: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), roles: [],
    });
    mockLogout.mockResolvedValueOnce(undefined);

    render(<AuthProvider><DisplayAuth /><LogoutButton /></AuthProvider>);
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    await user.click(screen.getByText("logout"));
    await waitFor(() => expect(screen.getByTestId("authenticated").textContent).toBe("false"));
    expect(mockDeleteCookie).toHaveBeenCalledWith("mp_access");
    expect(mockDeleteCookie).toHaveBeenCalledWith("mp_refresh");
  });
});
