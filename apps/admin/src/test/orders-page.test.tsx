import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrdersPage from "@/pages/OrdersPage";

vi.mock("react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

const { mockOrdersList } = vi.hoisted(() => ({ mockOrdersList: vi.fn() }));
vi.mock("@/lib/api", () => ({
  orders: { list: mockOrdersList },
}));

const MOCK_ORDERS = [
  {
    id: "aabbccdd-0000-0000-0000-000000000001",
    status: "pending",
    payment_status: "unpaid",
    total_ngn: 5000,
    created_at: new Date().toISOString(),
    items: [{ id: "i1", product_name: "Rice", qty: 2, unit_price_ngn: 2500 }],
  },
  {
    id: "aabbccdd-0000-0000-0000-000000000002",
    status: "delivered",
    payment_status: "paid",
    total_ngn: 3000,
    created_at: new Date().toISOString(),
    items: [{ id: "i2", product_name: "Pasta", qty: 1, unit_price_ngn: 3000 }],
  },
];

function renderWithQuery() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><OrdersPage /></QueryClientProvider>);
}

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrdersList.mockResolvedValue(MOCK_ORDERS);
  });

  it("renders the orders table with data", async () => {
    renderWithQuery();
    await waitFor(() => expect(screen.getAllByText(/#AABBCCDD/i).length).toBeGreaterThan(0));
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 data rows
  });

  it("shows order total formatted", async () => {
    renderWithQuery();
    await waitFor(() => expect(screen.getAllByText(/#AABBCCDD/i).length).toBeGreaterThan(0));
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it("shows empty state when no orders", async () => {
    mockOrdersList.mockResolvedValueOnce([]);
    renderWithQuery();
    await waitFor(() =>
      expect(screen.getByText(/no orders/i)).toBeInTheDocument()
    );
  });

  it("filters by status client-side when tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery();
    await waitFor(() => expect(screen.getAllByText(/#AABBCCDD/i).length).toBeGreaterThan(0));

    // Both rows visible initially
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 rows

    // Filter to "Pending" — only the pending order should show
    await user.click(screen.getByRole("button", { name: "Pending" }));
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 row
    });
  });

  it("shows only matching orders after status filter", async () => {
    const user = userEvent.setup();
    renderWithQuery();
    await waitFor(() => expect(screen.getAllByText(/#AABBCCDD/i).length).toBeGreaterThan(0));

    await user.click(screen.getByRole("button", { name: "Delivered" }));
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 delivered row
    });
  });
});
