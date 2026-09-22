# Standalone pricing calculator

## What will be built
- Add a public `/pricing-calculator` page for branded merchandise.
- Let visitors search and select a catalogue item, choose its quantity and an available decoration method, then calculate an indicative price.
- Show the item total, setup cost, freight, GST, total price, and any “price on application” result using the same rules as the shortlist.
- Add the configured item to the existing shortlist, with a clear route to review and submit the full shortlist.
- Link the calculator from the branded-merchandise menu and mobile navigation.

## Technical details
- Reuse the existing supplier-cost pricing engine, 65% markup, $15 freight, and 10% GST so calculator and shortlist totals stay consistent.
- Add a lightweight catalogue search function rather than loading the entire catalogue into the page.
- Use existing design tokens and controls, with responsive desktop and mobile layouts.
- Add route-specific search and social metadata, a canonical URL, and a sitemap entry.
- Verify the page interaction, mobile layout, typecheck, and preview build without publishing production.
