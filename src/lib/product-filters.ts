import type { CmsProduct } from "./catalog.functions";

export type ProductFilterValue = {
  decoration: string;
  impact: boolean;
  moq: number;
};

export const emptyFilters: ProductFilterValue = { decoration: "", impact: false, moq: 0 };

export const moqOptions = [
  { value: 0, label: "Any quantity" },
  { value: 25, label: "25 or fewer" },
  { value: 50, label: "50 or fewer" },
  { value: 100, label: "100 or fewer" },
];

const IMPACT_KEYWORDS = [
  "recycl",
  "rpet",
  "ocean",
  "bamboo",
  "cork",
  "organic",
  "eco",
  "wheat straw",
  "seed",
  "natural",
  "bio",
  "kraft",
];

/** First number in strings like "MOQ 25" or "50 units". */
export function parseMoq(moq: string): number | null {
  const match = /\d+/.exec(moq ?? "");
  return match ? Number(match[0]) : null;
}

export function isImpactAware(product: CmsProduct, categorySlug?: string): boolean {
  if (categorySlug === "eco") return true;
  const haystack =
    `${product.name} ${product.blurb} ${product.description} ${product.features} ${product.materials} ${product.colours}`.toLowerCase();
  return IMPACT_KEYWORDS.some((k) => haystack.includes(k));
}

/** Sorted list of every decoration tag used by the given products. */
export function decorationOptions(products: CmsProduct[]): string[] {
  return [...new Set(products.flatMap((p) => p.methods))].sort((a, b) => a.localeCompare(b));
}

export function matchesFilters(
  product: CmsProduct,
  filters: ProductFilterValue,
  categorySlug?: string,
): boolean {
  if (filters.decoration && !product.methods.includes(filters.decoration)) return false;
  if (filters.impact && !isImpactAware(product, categorySlug)) return false;
  if (filters.moq) {
    const moq = parseMoq(product.moq);
    if (moq === null || moq > filters.moq) return false;
  }
  return true;
}

/** Shared validateSearch shape for routes that expose product filters. */
export function parseFilterSearch(search: Record<string, unknown>): {
  decoration?: string;
  impact?: boolean;
  moq?: number;
} {
  const out: { decoration?: string; impact?: boolean; moq?: number } = {};
  const rawDecoration = search["decoration"];
  if (typeof rawDecoration === "string" && rawDecoration.trim()) {
    out.decoration = rawDecoration.slice(0, 60);
  }
  const rawImpact = search["impact"];
  if (rawImpact === true || rawImpact === "true" || rawImpact === "1") {
    out.impact = true;
  }
  const moq = Number(search["moq"]);
  if (Number.isFinite(moq) && moq > 0) out.moq = Math.min(9999, Math.round(moq));
  return out;
}
