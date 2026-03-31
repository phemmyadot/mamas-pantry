import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mamaspantry.com";
import { API_BASE } from "@/lib/api";

async function getProductSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products?limit=500`, { cache: "no-store" });
    if (!res.ok) return [];
    const products: { slug: string }[] = await res.json();
    return products.map((p) => p.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProductSlugs();

  const productUrls: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/shop/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL,                      changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/shop`,            changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/mums-picks`,      changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/pre-order`,       changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/delivery`,        changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/shop?category=imported`,  changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/shop?category=local`,     changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/shop?category=chilled`,   changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/shop?category=household`, changeFrequency: "weekly", priority: 0.7 },
    ...productUrls,
  ];
}
