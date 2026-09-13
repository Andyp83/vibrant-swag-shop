# Three business worlds, each with its own front door

Split the site into three self-contained parts — Promotional Merchandise, Print, and Gift Packs — so nothing mixes. The site's front page becomes a choice of the three, with its own polished interface.

## 1. New front page (`/`)

Replaces the current homepage content with a full-height chooser: three large colour-blocked panels (one per part of the business), each with its own hero imagery, a one-line description, and a "Enter" action. Slim header on this page — logo, the three links, and Get a quote. Existing homepage sections (steps, stats, banners, FAQ) move into the Merchandise landing page so nothing is lost.

## 2. Three landing pages

- `/merchandise` — Promotional Merchandise. Category tiles for the 11 promotional categories (Drinkware, Promotional Items, Headwear, Business Items, Outdoor & Leisure, Bags & Totes, Pens, Apparel, Packaging, Personal Products, Tech & Power), plus "Browse all merchandise", catalogues, sourcing, decoration, shortlist.
- `/print` — Print. The Print range and its sub-ranges, plus design studio, print brokering, artwork requirements and colour guide.
- `/gifts` — Gift Packs. Gift Packs and Hampers & Gifting ranges, the gift-pack types and gift enquiry entry point (links to the existing corporate gifts page).

Each landing page gets its own title, description, og tags and canonical link.

## 3. Separate menus per world

The top navigation changes to match the part of the site you're in:

- In merchandise: Categories (mega menu, promotional categories only), Catalogues, Sourcing, Decoration, Shortlist.
- In print: Print range, Design & artwork, Colour guide, Print brokering.
- In gifts: Gift packs, Hampers & gifting, Corporate gifts.

Every world nav starts with a home/back-to-chooser link, plus Client login and Get a quote. Mobile menu mirrors the same world-scoped sections.

## 4. Product listings stay inside their world

- "All products" no longer mixes worlds. The merchandise listing excludes Print, Gift Packs and Hampers & Gifting; the print listing shows only Print; the gifts listing shows only the two gifting categories.
- The category dropdown in filters only offers categories belonging to the current world.
- Category, sub-range and product pages keep their current URLs and inherit the world of their category, so the correct menu shows on those pages too.

## Technical notes

- New routes: `src/routes/merchandise.tsx`, `src/routes/print.tsx`, `src/routes/gifts.tsx`. `src/routes/index.tsx` becomes the chooser; its current sections move to the merchandise landing page.
- New `src/lib/worlds.ts` defining the three worlds (slug, label, accent, category slugs, nav links) and a `worldForCategory()` helper. `SiteHeader` picks the nav from the current route/category; `ProductWorldMenus` mega menus are reused, scoped per world.
- Migration: add `p_category_ids uuid[] DEFAULT '{}'` to `search_product_families` with `AND (array_length(p_category_ids,1) IS NULL OR p.category_id = ANY(p_category_ids))`; thread it through `listProductFamilies` and `productFamiliesQueryOptions` as an optional `categories: string[]`.
- `/products` gains a `world` search param (default merchandise) that sets the category id list and constrains the filter dropdown; print and gifts listings use the same component with their own world.
- Sitemap gains the three landing pages; footer links updated to the world front doors.

## Not included

Moving any product between categories, new catalogue data, or new imagery beyond reusing existing hero/category images.
