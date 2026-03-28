"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { ProductCategory } from "@/lib/api";

const TABS: { label: string; value: ProductCategory | "" }[] = [
  { label: "All", value: "" },
  { label: "Imported", value: "imported" },
  { label: "Local", value: "local" },
  { label: "Chilled", value: "chilled" },
  { label: "Household", value: "household" },
];

export default function ShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = (searchParams.get("category") ?? "") as ProductCategory | "";
  const currentSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  const navigate = useCallback(
    (category: ProductCategory | "", search: string) => {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (search.trim()) qs.set("search", search.trim());
      startTransition(() => {
        router.push(`/shop${qs.toString() ? `?${qs}` : ""}`);
      });
    },
    [router]
  );

  function handleTabClick(value: ProductCategory | "") {
    navigate(value, searchInput);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(currentCategory, searchInput);
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-cream-dark bg-white text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>
        <button
          type="submit"
          className="bg-forest-deep text-cream font-ui text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-forest-mid transition-colors"
        >
          Search
        </button>
      </form>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {TABS.map(({ label, value }) => {
          const isActive = currentCategory === value;
          return (
            <button
              key={value || "all"}
              onClick={() => handleTabClick(value)}
              disabled={isPending}
              className={`flex-shrink-0 font-ui text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                isActive
                  ? "bg-forest-deep text-cream border-forest-deep"
                  : "bg-white text-ink border-cream-dark hover:bg-forest-mist hover:border-forest-pale"
              } disabled:opacity-60`}
            >
              {label}
            </button>
          );
        })}
        {isPending && (
          <span className="font-ui text-xs text-muted ml-2 animate-pulse">Loading…</span>
        )}
      </div>
    </div>
  );
}
