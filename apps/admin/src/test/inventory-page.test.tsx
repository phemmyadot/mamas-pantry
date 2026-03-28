import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InventoryPage from "@/pages/InventoryPage";

vi.mock("react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

const { mockList, mockUpdate } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockUpdate: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  products: { list: mockList, update: mockUpdate },
}));

const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "Tomatoes",
    slug: "tomatoes",
    category: "local",
    price_ngn: 500,
    stock_qty: 20,
    is_active: true,
    is_mums_pick: false,
    image_url: null,
    images: [],
    description: null,
    badge: null,
    origin: null,
    compare_price_ngn: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Inactive Product",
    slug: "inactive-product",
    category: "imported",
    price_ngn: 2000,
    stock_qty: 5,
    is_active: false,
    is_mums_pick: false,
    image_url: null,
    images: [],
    description: null,
    badge: null,
    origin: null,
    compare_price_ngn: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function renderWithQuery() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><InventoryPage /></QueryClientProvider>);
}

describe("InventoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(MOCK_PRODUCTS);
    mockUpdate.mockResolvedValue({ ...MOCK_PRODUCTS[0], is_active: false });
  });

  it("renders both active and inactive products", async () => {
    renderWithQuery();
    await waitFor(() => screen.getByText("Tomatoes"));
    expect(screen.getByText("Inactive Product")).toBeInTheDocument();
  });

  it("shows low-stock row highlighted", async () => {
    mockList.mockResolvedValueOnce([{ ...MOCK_PRODUCTS[0], stock_qty: 2 }]);
    renderWithQuery();
    await waitFor(() => screen.getByText("Tomatoes"));
    const row = screen.getByText("Tomatoes").closest("tr");
    expect(row?.className).toContain("bg-red-50");
  });

  it("calls products.update with toggled is_active when toggle clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery();
    await waitFor(() => screen.getByText("Tomatoes"));

    // Toggle buttons are the rounded-full buttons without text
    const toggles = screen.getAllByRole("button").filter((b) =>
      b.className.includes("rounded-full") && !b.textContent
    );
    await user.click(toggles[0]);

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("p1", { is_active: false })
    );
  });

  it("filters by search text", async () => {
    const user = userEvent.setup();
    renderWithQuery();
    await waitFor(() => screen.getByText("Tomatoes"));

    await user.type(screen.getByPlaceholderText(/search products/i), "Tomato");
    await waitFor(() =>
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Tomato" })
      )
    );
  });
});
