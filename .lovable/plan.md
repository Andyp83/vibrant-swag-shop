# Brand Bento — branded merchandise & corporate gifts site

Neatly curated. Beautifully branded.

A bright, multi-colour merchandise site with a product showcase, decoration guide, and a working quote request form with logo/artwork uploads stored in Lovable Cloud.

## Design direction

- Palette pulled from the reference image: a full spectrum accent set (red, orange, yellow, lime, green, teal, cyan, blue, indigo, violet, pink, plus charcoal/off-white neutrals) as semantic tokens in the design system.
- Layout uses the "colour ray" idea from the image: bold spectrum stripes, per-category colour coding, chunky uppercase display type over a clean off-white base. No purple-gradient generic look.
- Every category, decoration method, and card carries its own accent colour so the site feels colourful without being noisy.

## Pages

1. **Home (`/`)** — spectrum hero with headline and dual CTA (Browse products / Get a quote), category tiles, "how it works" 4-step strip, decoration teaser, why-us stats, closing CTA.
2. **Products (`/products`)** — category grid: Drinkware, Apparel, Bags & Totes, Tech & Power, Stationery & Notebooks, Eco & Sustainable, Headwear, Gift Sets.
3. **Category detail (`/products/$category`)** — 6–8 example products per category with imagery, colour-availability chips, decoration methods suited to that product, and a "Quote this item" link that prefills the quote form.
4. **Decoration (`/decoration`)** — screen print, pad print, embroidery, laser engraving, digital/UV print, debossing, full-colour wrap, doming. Each with what it is, best for, colour limits, lead time, and artwork requirements. Plus an artwork-prep FAQ.
5. **Quote (`/quote`)** — quote request form with logo/artwork upload.

Each page gets its own title, description, og:title, og:description.

## Quote form + uploads

Fields: name, company, email, phone, product interest (prefilled from a product link), quantity, decoration preference, required-by date, budget guide, notes, and multi-file artwork upload (PNG/JPG/SVG/PDF/AI/EPS, up to 5 files, 20MB each). Client-side Zod validation with clear inline errors, success confirmation state.

## Technical notes

- Enable Lovable Cloud. Migration creates `quote_requests` (with grants + RLS: public insert only, no public read) and seeds nothing user-facing.
- Private storage bucket `quote-uploads`; uploads go to a per-submission folder, file paths saved on the quote row. Anonymous insert-only storage policy, no public read.
- Submission goes through a server function that validates input with Zod server-side and writes the row.
- Product/category data lives in a typed local data module (no CMS), so it's easy to swap in real photos later.
- AI-generated placeholder product imagery per category, stored as CDN asset pointers.
- Colour tokens added to `src/styles.css` in oklch; components use semantic classes only.

## Not included

Admin dashboard for viewing submitted quotes, email notifications, pricing/checkout. Easy to add later — say the word.
