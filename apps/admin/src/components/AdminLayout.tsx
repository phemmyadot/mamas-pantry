import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { orders } from "@/lib/api";

interface NavItem {
  to: string;
  label: string;
  iconName: "dashboard" | "orders" | "inventory" | "in_store" | "shipments" | "customers" | "staff_access" | "promos" | "delivery_fees" | "analytics" | "audit_logs";
  adminOnly?: boolean;
  hideForRider?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", iconName: "dashboard" },
  { to: "/orders", label: "Orders", iconName: "orders" },
  { to: "/inventory", label: "Inventory", iconName: "inventory", hideForRider: true },
  { to: "/in-store", label: "In-store", iconName: "in_store", hideForRider: true },
  { to: "/shipments", label: "Shipments", iconName: "shipments", adminOnly: true, hideForRider: true },
  { to: "/customers", label: "Customers", iconName: "customers", adminOnly: true, hideForRider: true },
  { to: "/staff-access", label: "Staff access", iconName: "staff_access", adminOnly: true, hideForRider: true },
  { to: "/promos", label: "Promos", iconName: "promos", adminOnly: true, hideForRider: true },
  { to: "/delivery-fees", label: "Delivery fees", iconName: "delivery_fees", adminOnly: true, hideForRider: true },
  { to: "/analytics", label: "Analytics", iconName: "analytics", adminOnly: true, hideForRider: true },
  { to: "/audit-logs", label: "Audit logs", iconName: "audit_logs", adminOnly: true, hideForRider: true },
];

function SideIcon({ name }: { name: NavItem["iconName"] }) {
  const paths: Record<NavItem["iconName"], string> = {
    dashboard: "M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-8h8V3h-8v10Z",
    orders: "M7 4h10l1 2h3v2h-1l-1.5 9h-13L4 8H3V6h3l1-2Zm1.3 2h7.4l-.5-1h-6.4l-.5 1Zm-.8 3 .9 6h7.2l.9-6H7.5Z",
    inventory: "M12 2l9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 15l9 5 9-5",
    in_store: "M4 7h16v12H4V7Zm2 2v8h12V9H6Zm2-4h8v2H8V5Z",
    shipments: "M3 11h11V4H3v7Zm11 0h7l-2-3h-5v3Zm-9 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    customers: "M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM8 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-3 0-6 1.5-6 3.5V18h12v-2.5C22 13.5 19 12 16 12ZM8 12c-2.8 0-5 1.2-5 3v3h5v-2.5c0-1 .4-1.9 1.1-2.6A8.5 8.5 0 0 0 8 12Z",
    staff_access: "M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4Zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-3 7h6v-1c0-1.1-1.8-2-3-2s-3 .9-3 2v1Z",
    promos: "M20 12a2 2 0 0 0 0-4h-2V6a2 2 0 0 0-2-2H4v4a2 2 0 1 1 0 4v4h12a2 2 0 0 0 2-2v-2h2Z",
    delivery_fees: "M3 6h13v9H3V6Zm13 3h5l-2-3h-3v3Zm-10 9a2 2 0 1 0 0 .01V18Zm11 0a2 2 0 1 0 0 .01V18Z",
    analytics: "M4 19h16v2H4v-2Zm2-2V9h2v8H6Zm5 0V5h2v12h-2Zm5 0v-6h2v6h-2Z",
    audit_logs: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4",
  };
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminLayout() {
  const { user, isAdmin, isRider, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: pendingOrders } = useQuery({
    queryKey: ["orders", "pending-count"],
    queryFn: () => orders.list({ status: "pending", limit: 1 }),
    refetchInterval: 60_000,
    select: (data) => data.length > 0,
  });

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const visibleNav = NAV.filter((n) => {
    if (n.adminOnly && !isAdmin) return false;
    if (isRider) return n.to === "/orders";
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-forest-mid flex-shrink-0">
        <p className="text-xl font-bold text-cream leading-none">
          Mama<em className="italic text-gold-light">&apos;s</em> Pantry
        </p>
        <p className="text-[10px] text-forest-pale opacity-60 mt-0.5 uppercase tracking-widest">Admin</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {visibleNav.map(({ to, label, iconName }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors relative
              ${isActive ? "bg-forest-mid text-cream" : "text-forest-pale hover:bg-forest-mid/50 hover:text-cream"}`
            }
          >
            <span className="w-5 text-center"><SideIcon name={iconName} /></span>
            <span>{label}</span>
            {label === "Orders" && pendingOrders && (
              <span className="ml-auto w-2 h-2 rounded-full bg-gold-light animate-pulse" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-forest-mid p-4 flex-shrink-0">
        <p className="text-xs text-forest-pale truncate mb-2">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-forest-pale hover:text-cream transition-colors"
        >
          Sign out -&gt;
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col w-56 bg-forest-deep flex-shrink-0 fixed top-0 left-0 h-full z-30">
        {sidebarContent}
      </aside>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-56 bg-forest-deep z-50 lg:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}

      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-12 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-1.5 rounded hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-500 ml-auto hidden sm:block">{user?.email}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
