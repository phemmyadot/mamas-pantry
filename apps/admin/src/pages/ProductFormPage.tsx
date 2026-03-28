import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { products, type ProductCreate, type ProductCategory } from "@/lib/api";
import { slugify } from "@/lib/utils";
import Spinner from "@/components/Spinner";

const CATEGORIES: ProductCategory[] = ["imported", "local", "chilled", "household"];

const EMPTY: ProductCreate = {
  name: "", slug: "", description: null,
  price_ngn: 0, compare_price_ngn: null,
  category: "local", is_mums_pick: false,
  badge: null, origin: null,
  image_url: null, images: [],
  stock_qty: 0, is_active: true,
};

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductCreate>(EMPTY);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState("");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => products.get(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        description: existing.description,
        price_ngn: existing.price_ngn,
        compare_price_ngn: existing.compare_price_ngn,
        category: existing.category,
        is_mums_pick: existing.is_mums_pick,
        badge: existing.badge,
        origin: existing.origin,
        image_url: existing.image_url,
        images: [],
        stock_qty: existing.stock_qty,
        is_active: existing.is_active,
      });
      setSlugManual(true);
    }
  }, [existing]);

  function set<K extends keyof ProductCreate>(k: K, v: ProductCreate[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "name" && !slugManual) next.slug = slugify(v as string);
      return next;
    });
  }

  const createMutation = useMutation({
    mutationFn: () => products.create(form),
    onSuccess: () => navigate("/inventory"),
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => products.update(id!, form),
    onSuccess: () => navigate("/inventory"),
    onError: (e: Error) => setError(e.message),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isNew) createMutation.mutate();
    else updateMutation.mutate();
  }

  if (!isNew && isLoading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-muted hover:text-forest-deep">← Back</button>
        <h1 className="text-xl font-bold text-forest-deep">{isNew ? "New product" : "Edit product"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Name + slug */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Name <span className="text-spice">*</span></label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Slug <span className="text-spice">*</span></label>
            <input
              required
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugManual(true); set("slug", e.target.value); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Description</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light resize-none"
          />
        </div>

        {/* Price + compare price */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Price (₦) <span className="text-spice">*</span></label>
            <input
              required
              type="number"
              min={0}
              value={form.price_ngn}
              onChange={(e) => set("price_ngn", Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Compare price (₦)</label>
            <input
              type="number"
              min={0}
              value={form.compare_price_ngn ?? ""}
              onChange={(e) => set("compare_price_ngn", e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              placeholder="Leave blank if no sale"
            />
          </div>
        </div>

        {/* Category + origin */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Category <span className="text-spice">*</span></label>
            <select
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value as ProductCategory)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Origin</label>
            <input
              type="text"
              value={form.origin ?? ""}
              onChange={(e) => set("origin", e.target.value || null)}
              placeholder="e.g. USA, Nigeria"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Image URL</label>
          <input
            type="url"
            value={form.image_url ?? ""}
            onChange={(e) => set("image_url", e.target.value || null)}
            placeholder="https://…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>

        {/* Badge */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Badge label</label>
          <input
            type="text"
            value={form.badge ?? ""}
            onChange={(e) => set("badge", e.target.value || null)}
            placeholder="e.g. New, Limited"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>

        {/* Stock qty */}
        <div className="w-40">
          <label className="block text-xs font-medium text-muted mb-1">Stock qty <span className="text-spice">*</span></label>
          <input
            required
            type="number"
            min={0}
            value={form.stock_qty}
            onChange={(e) => set("stock_qty", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          {[
            { key: "is_mums_pick" as const, label: "Mum's Pick" },
            { key: "is_active" as const, label: "Active (visible on store)" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="accent-forest-deep w-4 h-4"
              />
              <span className="text-sm text-ink">{label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-spice">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-forest-deep text-cream font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-muted hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
