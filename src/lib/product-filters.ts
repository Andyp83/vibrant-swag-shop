import type { CmsProduct } from "./catalog.functions";

export type ProductFilterValue = {
  decoration: string;
  colour: string;
  impact: boolean;
  moq: number;
};

export const emptyFilters: ProductFilterValue = {
  decoration: "",
  colour: "",
  impact: false,
  moq: 0,
};

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

/** Split a product's "Red, Navy / Black" colours string into clean names. */
export function colourNames(product: CmsProduct): string[] {
  return (product.colours ?? "")
    .split(/[,/]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Sorted list of every colour offered by the given products. */
export function colourOptions(products: CmsProduct[]): string[] {
  const names = new Set<string>();
  for (const p of products) {
    for (const name of colourNames(p)) names.add(name);
    for (const shot of p.colour_images ?? []) {
      if (shot.label?.trim()) names.add(shot.label.trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function productHasColour(product: CmsProduct, colour: string): boolean {
  const needle = colour.trim().toLowerCase();
  if (!needle) return true;
  if ((product.colours ?? "").toLowerCase().includes(needle)) return true;
  return (product.colour_images ?? []).some((shot) =>
    (shot.label ?? "").trim().toLowerCase().includes(needle),
  );
}

/**
 * The colour-specific photo for a product when a colour filter is active,
 * or null when no matching shot exists (fall back to the default image).
 */
export function colourImageFor(product: CmsProduct, colour: string): string | null {
  const needle = colour.trim().toLowerCase();
  if (!needle) return null;
  const shot = (product.colour_images ?? []).find((image) =>
    Boolean(image?.url) && (image.label ?? "").trim().toLowerCase().includes(needle),
  );
  return shot?.url ?? null;
}

const SWATCH_HEX: Record<string, string> = {
  black: "#1a1a1a", white: "#f8f8f8", red: "#e32636", orange: "#f47920",
  yellow: "#f5c518", green: "#2e8b57", teal: "#0f8b8d", blue: "#2266cc",
  navy: "#1f2a5a", purple: "#7b4bb3", pink: "#ef7fa8", grey: "#9aa0a6",
  gray: "#9aa0a6", silver: "#c8ccd2", gold: "#d4af37", brown: "#8a5a3b",
  maroon: "#7b2230", burgundy: "#7b2230", lime: "#a6c93b", khaki: "#b7a77a",
  cream: "#f3ead7", charcoal: "#3c4043", royal: "#3153b3", sky: "#7ec4e8",
};

/** CSS colour for a swatch dot, with a stable fallback hue for unknown names. */
export function colourSwatchCss(label: string): string {
  const key = label.trim().toLowerCase();
  if (SWATCH_HEX[key]) return SWATCH_HEX[key];
  for (const [name, hex] of Object.entries(SWATCH_HEX)) {
    if (key.includes(name)) return hex;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return `hsl(${((hash % 360) + 360) % 360} 65% 60%)`;
}

export function matchesFilters(
  product: CmsProduct,
  filters: ProductFilterValue,
  categorySlug?: string,
): boolean {
  if (filters.decoration && !product.methods.includes(filters.decoration)) return false;
  if (filters.colour && !productHasColour(product, filters.colour)) return false;
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
