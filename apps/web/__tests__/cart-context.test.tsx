import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/api";

const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Test Product",
  slug: "test-product",
  price_ngn: 1000,
  compare_price_ngn: null,
  category: "local",
  stock_qty: 10,
  is_mums_pick: false,
  is_active: true,
  image_url: null,
  images: [],
  description: null,
  badge: null,
  origin: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper component to surface cart state for assertions
function CartDisplay() {
  const { items, totalItems, totalPrice, addItem, removeItem, updateQty, clearCart } = useCart();
  return (
    <div>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="total-price">{totalPrice}</span>
      <span data-testid="items-count">{items.length}</span>
      <button onClick={() => addItem(mockProduct(), 1)}>add</button>
      <button onClick={() => addItem(mockProduct({ id: "prod-2", name: "Product 2", price_ngn: 500 }), 2)}>add2</button>
      <button onClick={() => removeItem("prod-1")}>remove</button>
      <button onClick={() => updateQty("prod-1", 3)}>update</button>
      <button onClick={() => updateQty("prod-1", 0)}>remove-via-update</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartDisplay />
    </CartProvider>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("starts empty", () => {
    renderCart();
    expect(screen.getByTestId("total-items").textContent).toBe("0");
    expect(screen.getByTestId("items-count").textContent).toBe("0");
  });

  it("adds an item", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    expect(screen.getByTestId("total-items").textContent).toBe("1");
    expect(screen.getByTestId("total-price").textContent).toBe("1000");
  });

  it("increments qty when same item added again", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("add"));
    expect(screen.getByTestId("total-items").textContent).toBe("2");
    expect(screen.getByTestId("items-count").textContent).toBe("1");
  });

  it("caps qty at stock_qty", async () => {
    const user = userEvent.setup();
    function StockCapDisplay() {
      const { addItem, totalItems } = useCart();
      return (
        <div>
          <span data-testid="total">{totalItems}</span>
          <button onClick={() => addItem(mockProduct({ stock_qty: 2 }), 5)}>add-over-stock</button>
        </div>
      );
    }
    render(<CartProvider><StockCapDisplay /></CartProvider>);
    await user.click(screen.getByText("add-over-stock"));
    expect(screen.getByTestId("total").textContent).toBe("2");
  });

  it("removes an item", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("remove"));
    expect(screen.getByTestId("total-items").textContent).toBe("0");
  });

  it("updateQty to 0 removes the item", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("remove-via-update"));
    expect(screen.getByTestId("items-count").textContent).toBe("0");
  });

  it("updateQty changes qty", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("update")); // qty -> 3
    expect(screen.getByTestId("total-items").textContent).toBe("3");
  });

  it("clearCart removes all items", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("add2"));
    await user.click(screen.getByText("clear"));
    expect(screen.getByTestId("total-items").textContent).toBe("0");
    expect(screen.getByTestId("items-count").textContent).toBe("0");
  });

  it("computes totalPrice correctly with multiple items", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));  // 1000 × 1
    await user.click(screen.getByText("add2")); // 500 × 2 = 1000
    expect(screen.getByTestId("total-price").textContent).toBe("2000");
  });

  it("persists to localStorage after add", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText("add"));
    const stored = JSON.parse(localStorage.getItem("mp_cart") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].product.id).toBe("prod-1");
  });
});
