# Consolidate product variants into single listings

Right now the catalogue lists every supplier line separately, so the same bottle appears
five times because of different sizes or lids (e.g. "Nomad Vacuum Bottle - 1L", "- Carry Lid",
"- Bambino"). This plan groups those together so each product shows once, with the variants
selectable inside the product window.

## What changes for the user

- Product grids (All products, category pages, lookbook) show one card per product family.
  ~2,840 listings condense to ~2,480, with the busiest families dropping from 15 cards to 1
  (e.g. Die Cut Box with Locking Lid).
- A card for a family shows a small "5 options" tag so it's clear there's more inside.
- The quick view gains an **Options** row above the colour swatches: pick 1L / Carry Lid /
  Stainless and the description, specs, MOQ, dimensions, colour swatches and photos all swap
  to that variant.
- Filters (colour, decoration, MOQ, sub-range) keep working: a family stays visible if any of
  its variants match, and the quick view opens on the matching variant.
- Existing direct product links keep working — nothing is deleted.

## Grouping rules

A family is formed from products in the same sub-range whose names share the part before the
first " - ", where the suffix looks like a variant rather than a different product:

- sizes and capacities: 1L, 500ml, Small/Medium/Large/XL, A4/A5/A6, 125x97x47mm, 28cm
- lids and closures: Carry Lid, Flip Lid, Screw Lid, Straw Lid, Sipper
- set counts and shapes: Set of 2, Round, Square, Oval
- finishes/decoration variants: Stainless, Powder Coated, Frosted, Bamboo, Debossed,
  Embossed, Full Colour, Translucent

Suffixes that don't match those patterns stay as separate products, so genuinely different
items are not merged. Single-variant products behave exactly as they do today.

## Technical notes

- Migration adds `variant_group` (text, nullable) and `variant_label` (text, nullable) to
  `catalog_products`, plus an index on `variant_group`, and backfills both with the rules above
  using SQL regex matching, scoped by `coalesce(subcategory_id, category_id)`. Families of one
  are left `NULL`. Admin CRUD is unaffected; new imports can be regrouped by re-running the
  backfill.
- `src/lib/catalog.functions.ts` selects the two new columns; the catalog cache gains a
  `groupProductsIntoFamilies` step producing `ProductFamily { key, primary, variants[] }`.
  The primary variant is the lowest `sort_order` with an image.
- `src/lib/product-filters.ts` filters and sorts at the family level (a family matches if any
  variant matches; colour-match score is the best score across variants).
- `src/components/site/ProductQuickView.tsx` takes a family, holds the selected variant in
  state, renders the Options chip row and derives gallery/colour data from the selection.
- Grid consumers (`products.index.tsx`, `products.$category.tsx`, `lookbook.tsx`) render
  families and pass the matched variant into the quick view.
- Verified with Playwright: family card counts, option switching, and colour filtering.
