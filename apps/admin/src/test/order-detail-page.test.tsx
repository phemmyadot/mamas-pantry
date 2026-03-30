import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrderDetailPage from "@/pages/OrderDetailPage";

vi.mock("react-router", () => ({
  useParams: () => ({ id: "order-uuid-1" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ isAdmin: true, isStaff: true, user: { email: "admin@test.com" } }),
}));

const { mockGet, mockUpdateStatus, mockAssignRider, mockRidersList } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdateStatus: vi.fn(),
  mockAssignRider: vi.fn(),
  mockRidersList: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  orders: {
    get: mockGet,
    updateStatus: mockUpdateStatus,
    assignRider: mockAssignRider,
  },
  riders: { list: mockRidersList },
}));

const MOCK_ORDER = {
  id: "order-uuid-1",
  status: "pending",
  payment_status: "unpaid",
  total_ngn: 5500,
  subtotal_ngn: 5000,
  delivery_fee_ngn: 500,
  created_at: new Date().toISOString(),
  rider_id: null,
  notes: null,
  delivery_address: { name: "Ada", phone: "08012345678", address: "1 Test St", city: "Lagos" },
  items: [{ id: "i1", product_name: "Rice", qty: 2, unit_price_ngn: 2500 }],
};

function renderWithQuery() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <OrderDetailPage />
      </QueryClientProvider>
    ),
  };
}

describe("OrderDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(MOCK_ORDER);
    mockRidersList.mockResolvedValue([]);
    mockUpdateStatus.mockResolvedValue({ ...MOCK_ORDER, status: "confirmed" });
  });

  it("renders order details", async () => {
    renderWithQuery();
    await waitFor(() => screen.getByText(/ORDER-UU/i));
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("08012345678")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
  });

  it("shows status in the select", async () => {
    renderWithQuery();
    await waitFor(() => screen.getByText(/ORDER-UU/i));
    const selects = screen.getAllByRole("combobox");
    expect((selects[0] as HTMLSelectElement).value).toBe("pending");
  });

  it("calls updateStatus when status changed", async () => {
    const user = userEvent.setup();
    renderWithQuery();
    await waitFor(() => screen.getByText(/ORDER-UU/i));

    const select = screen.getAllByRole("combobox")[0];
    await user.selectOptions(select, "confirmed");

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith("order-uuid-1", "confirmed")
    );
  });

  it("invalidates both order and orders queries on status update", async () => {
    const user = userEvent.setup();
    const { qc } = renderWithQuery();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    await waitFor(() => screen.getByText(/ORDER-UU/i));
    const select = screen.getAllByRole("combobox")[0];
    await user.selectOptions(select, "confirmed");

    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalled());
    await waitFor(() => {
      const calls = invalidateSpy.mock.calls;
      const queryKeys = calls.map((c) => (c[0] as { queryKey: unknown[] })?.queryKey);
      expect(queryKeys).toContainEqual(["order", "order-uuid-1"]);
      expect(queryKeys).toContainEqual(["orders"]);
    });
  });
});
