/**
 * The site is split into three self-contained parts ("worlds"). Each has its own
 * front door, its own navigation, and product listings that never mix with the others.
 */
export type WorldSlug = "merchandise" | "print" | "gifts";

export const PRINT_CATEGORY_SLUGS = ["print"];
export const GIFT_CATEGORY_SLUGS = ["gift-packs", "hampers-gifting"];
/** Anything that is not print and not gifting is promotional merchandise. */
export const NON_MERCH_CATEGORY_SLUGS = [...PRINT_CATEGORY_SLUGS, ...GIFT_CATEGORY_SLUGS];

export type World = {
  slug: WorldSlug;
  /** Landing page path. */
  path: "/merchandise" | "/print" | "/gifts";
  label: string;
  short: string;
  tagline: string;
  blurb: string;
  /** Spectrum accent key used for colour blocking. */
  accent: string;
};

export const worlds: World[] = [
  {
    slug: "merchandise",
    path: "/merchandise",
    label: "Promotional Merchandise",
    short: "Merchandise",
    tagline: "Brandable products, decorated in-house",
    blurb:
      "Drinkware, apparel, bags, pens, headwear, tech and more — over 2,500 products ready for your logo.",
    accent: "red",
  },
  {
    slug: "print",
    path: "/print",
    label: "Design & Print",
    short: "Print",
    tagline: "Artwork, design and trade print",
    blurb:
      "Business cards, signage, labels, magnets and stickers, plus a design studio to set the artwork up properly.",
    accent: "cyan",
  },
  {
    slug: "gifts",
    path: "/gifts",
    label: "Gift Packs",
    short: "Gifts",
    tagline: "Curated packs, hampers and kits",
    blurb:
      "Onboarding kits, client hampers, event gifts and milestone packs — assembled, packed and delivered.",
    accent: "violet",
  },
];

export function worldBySlug(slug: WorldSlug): World {
  return worlds.find((w) => w.slug === slug) ?? worlds[0]!;
}

/** Which world a catalogue category belongs to. */
export function worldForCategory(categorySlug: string): WorldSlug {
  if (PRINT_CATEGORY_SLUGS.includes(categorySlug)) return "print";
  if (GIFT_CATEGORY_SLUGS.includes(categorySlug)) return "gifts";
  return "merchandise";
}

/** The category slugs a world's listings are allowed to show. */
export function categorySlugsForWorld(
  world: WorldSlug,
  allCategories: { slug: string }[],
): string[] {
  if (world === "print") return PRINT_CATEGORY_SLUGS.filter((s) => has(allCategories, s));
  if (world === "gifts") return GIFT_CATEGORY_SLUGS.filter((s) => has(allCategories, s));
  return allCategories
    .map((c) => c.slug)
    .filter((slug) => !NON_MERCH_CATEGORY_SLUGS.includes(slug));
}

function has(categories: { slug: string }[], slug: string) {
  return categories.some((c) => c.slug === slug);
}

export function parseWorld(value: unknown): WorldSlug {
  return value === "print" || value === "gifts" ? value : "merchandise";
}
