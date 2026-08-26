# Three-slide rotating hero

Replace the single homepage hero with an auto-rotating hero that tells the whole See See Bloom story: branded merchandise, design & print, and gifting.

## The three slides

1. **Merch worth keeping** — branded merchandise
   - Dark spectrum world (current hero look, unchanged in feel): spinning spectrum rays, existing product line-up image.
   - Eyebrow: "Branded merchandise · Promotional product"
   - Copy: sourced, decorated and delivered in every colour of the spectrum.
   - Buttons: Browse products / Get a quote

2. **Design it with us** — design & print
   - Bright ink-splash world: lighter panel with cyan/magenta/yellow accents and a printed-sheet feel.
   - Eyebrow: "Design services · Print"
   - Copy: upload your template or start from scratch — our studio builds the artwork, we print it.
   - Buttons: Explore print & decoration / Upload your artwork (quote form)

3. **Gifts they remember** — hampers & gifting
   - Warm onyx/gold world: deep charcoal with warm gold accents, softer type.
   - Eyebrow: "Hampers · Client & staff gifting"
   - Copy: curated hampers, welcome packs and Christmas gifting, kitted and drop-shipped.
   - Buttons: See gifting options / Plan a gifting project

## Behaviour

- Auto-advances every 7 seconds, loops continuously.
- Dot indicators plus left/right arrows; pausing on hover or keyboard focus.
- Swipe on touch devices.
- Respects the existing reduced-motion setting: no auto-advance and no spin, first slide shown with arrows/dots still usable.
- Cross-fade plus a gentle rise on the headline and copy so each slide has its own entrance.
- Fixed hero height per breakpoint so switching slides doesn't shift the page.
- The spectrum bar stays at the bottom of the hero; its accent shifts to match the active slide.

## Imagery

Three new hero images generated in the existing studio style, matching each slide's colour world, saved as project assets and served responsively (as the current hero already is). The current merchandise line-up image is kept for slide 1.

## Technical notes

- New `src/components/site/HeroCarousel.tsx` owning slide state, timers, hover/focus pause and keyboard/swipe handling; slide content defined as a typed array (eyebrow, headline words, body, CTAs, image, theme tokens).
- Per-slide colour worlds implemented as theme classes driven by tokens added to `src/styles.css` (no hardcoded colour utilities).
- `src/routes/index.tsx` swaps its hero `<section>` for `<HeroCarousel />`; everything below the hero (ticker, banners, categories, how it works, FAQ, CTA) is untouched.
- Slide 1 image keeps `loading="eager"` / `fetchPriority="high"`; slides 2 and 3 load lazily so first paint stays fast.
- Uses `useReducedMotion` from the existing hook.
