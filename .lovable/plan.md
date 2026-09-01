# Stop loading the whole catalogue on every page

The catalogue pages currently ask the database for **every** product, every product photo and
every colour row, then filter in the browser. That's ~2,800 products plus ~16,000 image rows and
~8,700 colour rows per page view. The database keeps hitting its time limit (hundreds of timeouts
in ten minutes) and shoppers see slow pages, missing products, or an error page.

## What changes for shoppers

- Product pages load a page of products at a time instead of the whole catalogue, so they open in
  well under a second.
- Category, sub-range, colour, decoration, MOQ and eco filters keep working exactly as they do
  now, but the filtering happens in the database instead of the browser.
- Nothing about the layout, the quick view, the shortlist or the admin screens changes visually.

## Approach

1. **New paged read.** Add `listProducts({ categorySlug, subcategorySlug, colours, colourMode,
   decoration, moqMax, impact, sort, page })` that returns one page (e.g. 60 families) plus a total
   count. Filtering, sorting and paging all happen in SQL, using the existing indexes plus the new
   `impact_aware` flag.
2. **Images and colours on demand.** Only fetch `catalog_product_images` /
   `catalog_product_colours` for the products on the current page (`in ('id', ids)`), not the whole
   table.
3. **Variant families in the database.** Collapse variants with a SQL grouping on
   `variant_group` so page sizes stay stable; the quick view keeps fetching a family's variants on
   demand.
4. **Route updates.** `/products`, `/products/$category`, `/products/$category/$subcategory` and
   `/lookbook` switch to the paged query with URL-driven page state. The product detail route reads
   a single product by slug instead of scanning the catalogue. Quote and admin screens switch to
   the lighter `listCategories` plus their own paged reads.
5. **Bound the retry loop.** `fetchAllRows` currently halves the page size and retries forever on
   timeout, which keeps the connection pool saturated. Cap it (max 3 shrink steps, minimum page
   size 100) and fail fast with a clear error.
6. **Keep `listCatalog`** only for the sitemap/MCP paths that genuinely need everything, with the
   bounded retry above.

## Verification

- Measure `/products`, `/products/drinkware` and `/lookbook` response size and time before/after.
- Playwright pass over colour, eco, MOQ and sub-range filters plus pagination and quick view.
- Re-check the database logs for statement timeouts after the change.
