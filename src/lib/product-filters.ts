import type { CmsProduct } from "./catalog.functions";

export type ColourMatchMode = "any" | "all";

export type ProductSortMode = "default" | "colour-match";

export type GridDensity = "3" | "5";

export type ProductFilterValue = {
  category: string;
  subcategory: string;
  decoration: string;
  colours: string[];
  colourMatch: ColourMatchMode;
  sort: ProductSortMode;
  impact: boolean;
  moq: number;
  density: GridDensity;
};

export const emptyFilters: ProductFilterValue = {
  category: "",
  subcategory: "",
  decoration: "",
  colours: [],
  colourMatch: "any",
  sort: "default",
  impact: false,
  moq: 0,
  density: "5",
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
  // The catalogue list omits long-text columns; the database exposes a
  // generated flag computed from the full product text.
  if (typeof product.impact_aware === "boolean") return product.impact_aware;
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

/** Canonical colour palette exposed in product filters. */
export const ALLOWED_COLOURS = [
  "Natural",
  "Pink",
  "Green",
  "Yellow",
  "Teal",
  "Light Blue",
  "Black",
  "Silver",
  "Brown",
  "White",
  "Gray",
  "Gold",
  "Clear",
  "Navy",
  "Gunmetal",
  "Orange",
  "Blue",
  "Purple",
  "Bright Green",
  "Red",
];

/** Sorted list of every colour offered by the given products, restricted to the canonical palette. */
export function colourOptions(products: CmsProduct[]): string[] {
  const available = new Set<string>();
  for (const p of products) {
    for (const name of colourNames(p)) {
      const canonical = canonicalColour(name);
      if (canonical) available.add(canonical);
    }
    for (const shot of p.colour_images ?? []) {
      const canonical = canonicalColour(shot.label);
      if (canonical) available.add(canonical);
    }
    for (const image of p.images ?? []) {
      const canonical = canonicalColour(image.colour_label ?? "");
      if (canonical) available.add(canonical);
    }
  }
  return ALLOWED_COLOURS.filter((c) => available.has(c));
}

/** Map a free-form colour name to its canonical palette entry, or null if it is not in the palette. */
function canonicalColour(label?: string): string | null {
  if (!label?.trim()) return null;
  const key = label.trim().toLowerCase();
  return ALLOWED_COLOURS.find((c) => c.toLowerCase() === key) ?? null;
}

const COLOUR_ALIASES: Record<string, string[]> = {
  gray: ["grey"],
  grey: ["gray"],
  "light blue": ["sky", "sky blue", "pale blue"],
  "bright green": ["lime", "neon green"],
  natural: ["beige", "tan", "cream", "khaki", "stone", "sand"],
  gunmetal: ["charcoal", "dark grey", "dark gray"],
  clear: ["transparent"],
  white: ["off white", "off-white"],
  black: ["matte black"],
  red: ["maroon", "burgundy"],
  blue: ["royal", "royal blue", "cobalt"],
  navy: ["navy blue"],
  brown: ["chocolate", "coffee"],
};

/** All search terms that should match a given canonical colour. */
function colourSearchTerms(colour: string): string[] {
  const key = colour.trim().toLowerCase();
  return [key, ...(COLOUR_ALIASES[key] ?? [])];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A Postgres regex alternation ("red|maroon|burgundy") matching every search
 * term for a canonical colour. Used by the database-side catalogue search so
 * colour filtering behaves the same on the server as it does in the browser.
 */
export function colourRegexPattern(colour: string): string {
  return colourSearchTerms(colour).map(escapeRegex).filter(Boolean).join("|");
}

export function productHasColour(product: CmsProduct, colour: string): boolean {
  const needle = colour.trim().toLowerCase();
  if (!needle) return true;
  const terms = colourSearchTerms(needle);
  const colourText = (product.colours ?? "").toLowerCase();
  if (terms.some((t) => colourText.includes(t))) return true;
  if ((product.images ?? []).some((shot) => {
    const label = (shot.colour_label ?? "").trim().toLowerCase();
    return terms.some((t) => label.includes(t));
  })) {
    return true;
  }
  return (product.colour_images ?? []).some((shot) => {
    const label = (shot.label ?? "").trim().toLowerCase();
    return terms.some((t) => label.includes(t));
  });
}

/** True when the product satisfies the selected colours under the given match mode. */
export function productMatchesColours(
  product: CmsProduct,
  colours: string[],
  mode: ColourMatchMode = "any",
): boolean {
  const wanted = colours.map((c) => c.trim()).filter(Boolean);
  if (wanted.length === 0) return true;
  return mode === "all"
    ? wanted.every((c) => productHasColour(product, c))
    : wanted.some((c) => productHasColour(product, c));
}

/**
 * The colour-specific photo for a product when a colour filter is active,
 * or null when no matching shot exists (fall back to the default image).
 * With several colours selected, the first selected colour that has a photo wins.
 */
export function colourImageFor(product: CmsProduct, colour: string | string[]): string | null {
  const wanted = (Array.isArray(colour) ? colour : [colour]).map((c) => c.trim()).filter(Boolean);
  for (const needle of wanted.map((c) => c.toLowerCase())) {
    const terms = colourSearchTerms(needle);
    const galleryShot = (product.images ?? []).find((image) =>
      Boolean(image?.image_url) && terms.some((t) => (image.colour_label ?? "").trim().toLowerCase().includes(t)),
    );
    if (galleryShot?.image_url) return galleryShot.image_url;

    const shot = (product.colour_images ?? []).find((image) =>
      Boolean(image?.url) && terms.some((t) => (image.label ?? "").trim().toLowerCase().includes(t)),
    );
    if (shot?.url) return shot.url;
  }
  return null;
}

/**
 * How well a product matches the selected colours.
 * Each selected colour scores 2 when the product has a photo in that colour,
 * and 1 when it lists the colour without a dedicated photo.
 */
export function colourMatchScore(product: CmsProduct, colours: string[]): number {
  let score = 0;
  for (const colour of colours.map((c) => c.trim()).filter(Boolean)) {
    if (colourImageFor(product, colour)) score += 2;
    else if (productHasColour(product, colour)) score += 1;
  }
  return score;
}

/**
 * Products ordered by colour-match strength (photo matches first), keeping the
 * original order for ties. Returns the input order for any other sort mode.
 */
export function sortProducts<T>(
  items: T[],
  filters: ProductFilterValue,
  getProduct: (item: T) => CmsProduct,
): T[] {
  if (filters.sort !== "colour-match" || (filters.colours ?? []).length === 0) return items;
  return items
    .map((item, index) => ({
      item,
      index,
      score: colourMatchScore(getProduct(item), filters.colours),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}


const SWATCH_HEX: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f8f8f8",
  red: "#e32636",
  orange: "#f47920",
  yellow: "#f5c518",
  green: "#2e8b57",
  "bright green": "#39ff14",
  teal: "#0f8b8d",
  blue: "#2266cc",
  "light blue": "#87ceeb",
  navy: "#1f2a5a",
  purple: "#7b4bb3",
  pink: "#ef7fa8",
  grey: "#9aa0a6",
  gray: "#9aa0a6",
  silver: "#c8ccd2",
  gold: "#d4af37",
  brown: "#8a5a3b",
  natural: "#c4a77d",
  clear: "#e8f4f8",
  gunmetal: "#2a3439",
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
  if (!productMatchesColours(product, filters.colours ?? [], filters.colourMatch ?? "any")) {
    return false;
  }
  if (filters.impact && !isImpactAware(product, categorySlug)) return false;
  if (filters.moq) {
    const moq = parseMoq(product.moq);
    if (moq === null || moq > filters.moq) return false;
  }
  return true;
}

/** Shared validateSearch shape for routes that expose product filters. */
export function parseFilterSearch(search: Record<string, unknown>): {
  category?: string;
  sub?: string;
  decoration?: string;
  colour?: string;
  colourMatch?: ColourMatchMode;
  sort?: ProductSortMode;
  impact?: boolean;
  moq?: number;
  density?: GridDensity;
  page?: number;
} {
  const out: {
    category?: string;
    sub?: string;
    decoration?: string;
    colour?: string;
    colourMatch?: ColourMatchMode;
    sort?: ProductSortMode;
    impact?: boolean;
    moq?: number;
    density?: GridDensity;
    page?: number;
  } = {};
  const rawCategory = search["category"];
  if (typeof rawCategory === "string" && rawCategory.trim()) {
    out.category = rawCategory.slice(0, 80);
  }
  const rawSub = search["sub"];
  if (typeof rawSub === "string" && rawSub.trim()) {
    out.sub = rawSub.slice(0, 80);
  }
  const rawDecoration = search["decoration"];
  if (typeof rawDecoration === "string" && rawDecoration.trim()) {
    out.decoration = rawDecoration.slice(0, 60);
  }
  const rawColour = search["colour"];
  if (typeof rawColour === "string" && rawColour.trim()) {
    out.colour = rawColour.slice(0, 400);
  } else if (Array.isArray(rawColour)) {
    const joined = rawColour.filter((c): c is string => typeof c === "string").join(",");
    if (joined.trim()) out.colour = joined.slice(0, 400);
  }
  if (search["colourMatch"] === "all") out.colourMatch = "all";
  if (search["sort"] === "colour-match") out.sort = "colour-match";

  const rawDensity = search["density"];
  if (rawDensity === "3" || rawDensity === "5") out.density = rawDensity;

  const rawImpact = search["impact"];
  if (rawImpact === true || rawImpact === "true" || rawImpact === "1") {
    out.impact = true;
  }
  const moq = Number(search["moq"]);
  if (Number.isFinite(moq) && moq > 0) out.moq = Math.min(9999, Math.round(moq));
  const page = Number(search["page"]);
  if (Number.isFinite(page) && page > 1) out.page = Math.min(400, Math.round(page));
  return out;
}

/** Parse the `colour` search param ("Navy,Red") into a clean list of colour names. */
export function coloursFromSearch(colour?: string): string[] {
  return (colour ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** Serialise selected colours back into a single search param value. */
export function coloursToSearch(colours: string[]): string {
  return colours.map((c) => c.trim()).filter(Boolean).join(",");
}

/**
 * A group of products that are really the same item in different sizes, lids or
 * finishes. Single products become a family of one.
 */
export type ProductFamily = {
  key: string;
  /** Shared name without the variant suffix. */
  name: string;
  /** The variant used for the card image and default quick-view selection. */
  primary: CmsProduct;
  variants: CmsProduct[];
};

/** Name shown for a variant option chip. */
export function variantLabel(product: CmsProduct): string {
  return (product.variant_label ?? "").trim() || "Standard";
}

/** Group products into families using the variant grouping stored on each product. */
export function groupFamilies(products: CmsProduct[]): ProductFamily[] {
  const families: ProductFamily[] = [];
  const byKey = new Map<string, ProductFamily>();

  for (const product of products) {
    const key = (product.variant_group ?? "").trim();
    if (!key) {
      families.push({ key: `single:${product.id}`, name: product.name, primary: product, variants: [product] });
      continue;
    }
    const existing = byKey.get(key);
    if (existing) {
      existing.variants.push(product);
      continue;
    }
    const family: ProductFamily = {
      key,
      name: product.name.split(" - ")[0] ?? product.name,
      primary: product,
      variants: [product],
    };
    byKey.set(key, family);
    families.push(family);
  }

  for (const family of families) {
    if (family.variants.length < 2) continue;
    family.variants.sort(
      (a, b) => a.sort_order - b.sort_order || variantLabel(a).localeCompare(variantLabel(b)),
    );
    family.primary =
      family.variants.find((v) => Boolean(v.image_url)) ?? family.variants[0] ?? family.primary;
  }

  return families;
}

/** True when any variant in the family satisfies the filters. */
export function familyMatchesFilters(
  family: ProductFamily,
  filters: ProductFilterValue,
  categorySlug?: string,
): boolean {
  return family.variants.some((variant) => matchesFilters(variant, filters, categorySlug));
}

/**
 * The variant to feature for the current filters: the first one that matches,
 * preferring one with a photo in a selected colour.
 */
export function featuredVariant(family: ProductFamily, filters: ProductFilterValue): CmsProduct {
  const colours = filters.colours ?? [];
  if (colours.length) {
    const withPhoto = family.variants.find((v) => colourImageFor(v, colours));
    if (withPhoto) return withPhoto;
    const listed = family.variants.find((v) => productMatchesColours(v, colours, filters.colourMatch));
    if (listed) return listed;
  }
  return family.primary;
}

/** Best colour-match score across the family's variants. */
export function familyColourMatchScore(family: ProductFamily, colours: string[]): number {
  return family.variants.reduce((best, v) => Math.max(best, colourMatchScore(v, colours)), 0);
}

/** Families ordered by colour-match strength, keeping input order for ties. */
export function sortFamilies(
  families: ProductFamily[],
  filters: ProductFilterValue,
): ProductFamily[] {
  if (filters.sort !== "colour-match" || (filters.colours ?? []).length === 0) return families;
  return families
    .map((family, index) => ({
      family,
      index,
      score: familyColourMatchScore(family, filters.colours),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.family);
}

/** Build display families from a database page of grouped variants. */
export function familiesFromPage(
  page: { key: string; variants: CmsProduct[] }[],
): ProductFamily[] {
  return page
    .filter((entry) => entry.variants.length > 0)
    .map((entry) => {
      const variants = [...entry.variants].sort(
        (a, b) => a.sort_order - b.sort_order || variantLabel(a).localeCompare(variantLabel(b)),
      );
      const primary = variants.find((v) => Boolean(v.image_url)) ?? variants[0]!;
      const name =
        variants.length > 1 ? (primary.name.split(" - ")[0] ?? primary.name) : primary.name;
      return { key: entry.key, name, primary, variants };
    });
}
