import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { orders } from "@/lib/api";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/orders",    label: "Orders",    icon: "📦" },
  { to: "/inventory", label: "Inventory", icon: "🗄" },
  { to: "/shipments", label: "Shipments", icon: "✈️" },
  { to: "/customers", label: "Customers", icon: "👤", adminOnly: true },
  { to: "/riders",    label: "Riders",    icon: "🛵" },
  { to: "/promos",    label: "Promos",    icon: "🏷" },
  { to: "/analytics", label: "Analytics", icon: "📊", adminOnly: true },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
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

  const visibleNav = isAdmin ? NAV : NAV.filter((n) => !n.adminOnly);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-forest-mid flex-shrink-0">
        <p className="text-xl font-bold text-cream leading-none">
          Mama<em className="italic text-gold-light">&apos;s</em> Pantry
        </p>
        <p className="text-[10px] text-forest-pale opacity-60 mt-0.5 uppercase tracking-widest">Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {visibleNav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors relative
              ${isActive ? "bg-forest-mid text-cream" : "text-forest-pale hover:bg-forest-mid/50 hover:text-cream"}`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            <span>{label}</span>
            {label === "Orders" && pendingOrders && (
              <span className="ml-auto w-2 h-2 rounded-full bg-gold-light animate-pulse" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-forest-mid p-4 flex-shrink-0">
        <p className="text-xs text-forest-pale truncate mb-2">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-forest-pale hover:text-cream transition-colors"
        >
          Sign out →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-forest-deep flex-shrink-0 fixed top-0 left-0 h-full z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-56 bg-forest-deep z-50 lg:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
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

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
