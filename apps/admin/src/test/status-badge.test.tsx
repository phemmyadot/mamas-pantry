import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders known status labels correctly", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("formats out_for_delivery as 'Out for delivery'", () => {
    render(<StatusBadge status="out_for_delivery" />);
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
  });

  it("formats in_transit as 'In transit'", () => {
    render(<StatusBadge status="in_transit" />);
    expect(screen.getByText("In transit")).toBeInTheDocument();
  });

  it("replaces underscores for unknown status", () => {
    render(<StatusBadge status="some_status" />);
    expect(screen.getByText("some status")).toBeInTheDocument();
  });

  it("applies correct color for delivered", () => {
    render(<StatusBadge status="delivered" />);
    const badge = screen.getByText("delivered");
    expect(badge.className).toContain("bg-green-100");
  });

  it("applies correct color for cancelled", () => {
    render(<StatusBadge status="cancelled" />);
    const badge = screen.getByText("cancelled");
    expect(badge.className).toContain("bg-red-100");
  });

  it("applies fallback color for unknown status", () => {
    render(<StatusBadge status="unknown_status" />);
    const badge = screen.getByText("unknown status");
    expect(badge.className).toContain("bg-gray-100");
  });
});
