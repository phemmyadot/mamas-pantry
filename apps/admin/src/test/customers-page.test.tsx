import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CustomersPage from "@/pages/CustomersPage";

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock("@/lib/api", () => ({
  customers: { list: mockList },
}));

const MOCK_CUSTOMERS = [
  {
    id: "c1",
    email: "alice@example.com",
    full_name: "Alice Okafor",
    order_count: 5,
    total_spend_ngn: 25000,
    created_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "c2",
    email: "bob@example.com",
    full_name: null,
    order_count: 0,
    total_spend_ngn: 0,
    created_at: "2025-02-15T08:00:00Z",
  },
];

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(MOCK_CUSTOMERS);
  });

  it("renders customer list", async () => {
    renderWithQuery(<CustomersPage />);
    await waitFor(() => screen.getByText("Alice Okafor"));
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("shows dash when full_name is null", async () => {
    renderWithQuery(<CustomersPage />);
    await waitFor(() => screen.getByText("bob@example.com"));
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows order count", async () => {
    renderWithQuery(<CustomersPage />);
    await waitFor(() => screen.getByText("Alice Okafor"));
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows total spend formatted", async () => {
    renderWithQuery(<CustomersPage />);
    await waitFor(() => screen.getByText("Alice Okafor"));
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it("shows empty state when no customers", async () => {
    mockList.mockResolvedValueOnce([]);
    renderWithQuery(<CustomersPage />);
    await waitFor(() =>
      expect(screen.getByText(/no customers yet/i)).toBeInTheDocument()
    );
  });

  it("passes pagination params to API", async () => {
    renderWithQuery(<CustomersPage />);
    await waitFor(() => screen.getByText("Alice Okafor"));
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 25 })
    );
  });
});
