# Replace Trends catalogue product information

## What will change
- Treat the uploaded 2,812-row Trends catalogue as the source of truth for all existing Trends products, matched by PLU.
- Replace each matched product’s name, service, description, features, specifications, colours, dimensions, materials, branding options, packaging, carton details, source URL, decoration methods, and Impact Aware flag with the workbook values.
- Remove supplier prices, stock snapshots, additional-cost tables, shipping prices, and any other old product text not present in the workbook.
- Keep See See Bloom’s categories, URLs, images, publish state, review workflow, customer records, quotes, pricing settings, and the separate gift-pack products unchanged.
- Report workbook products missing from the site and site Trends products missing from the workbook rather than guessing or deleting them.

## Validation
- Compare PLU coverage and duplicate counts before updating.
- Confirm representative products exactly match the workbook after the update and no Trends carton details contain prices.
- Check that product pages, filters, shortlist, and catalogue browsing still load.
- Run focused tests, type checks, and the preview build. Do not publish production.

## Technical details
- Perform a data-only, PLU-keyed update without changing the database structure.
- Derive decoration method names from the workbook’s Branding Options field and recalculate the Impact Aware flag only from workbook content.
- Keep the workbook outside the app; it is import source material, not a public download.
