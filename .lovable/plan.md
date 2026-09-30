# Product page becomes a pick-and-add form

## What customers will see
- **Colour**: each colour code turns into a clear tap button (code + name). Pick one; tap again to clear. It's optional, so "not chosen" means "recommend for me". Picking a colour also switches the main photo to that colour when a matching photo exists.
- **Branding options**: a list of buttons, one per branding option from the product details (e.g. "Pad Print"). The print area size sits beside each button (e.g. "45mm circle · 50mm x 25mm"). Customers can pick **several**, so each one can be priced separately.
- **Optional extras**: only shown when the product text mentions an optional add-on such as a gift box or gift box sleeve. Each extra is a tap button too. No free-text box.
- A short line above the buttons says: "Tap a colour, branding options and any extras, then add to your shortlist."
- "Quote this item" is removed. The main button now reads **Add to Shortlist**. If the item is already on the shortlist, the same button reads "Update shortlist" and saves the new choices.
- Quantity isn't asked here. Customers still set it on the shortlist page.

## Shortlist
- Each shortlist line shows the chosen colour, all chosen branding options (with sizes) and extras.
- Those choices go into the quote request and the staff quote, so you can see and price each branding option.
- Anything already on a shortlist stays as it is.

## Technical details
- `src/lib/shortlist.ts`: add optional `colour`, `brandings: {method, size}[]`, `extras: string[]` to `ShortlistItem`, plus an `upsert(input, choices)` function. Old saved items still load with empty values. `shortlistSummary` includes the new fields.
- New helper `src/lib/product-options.ts`:
  - `parseBrandingOptions(branding_options)` splits the text on " | ". A "Method: size" entry starts a new option. An entry with no method name adds another size to the previous option. Entries are matched against `product.methods`.
  - `detectExtras(features, packaging, specifications)` finds phrases like "optional gift box" or "gift box sleeve" and removes duplicates.
- Product page (`products.$category_.$subcategory_.$product.tsx`): add state for colour, brandings and extras. Render the new button groups with `aria-pressed`, using the category's accent colour for the selected style. Replace the quote link with the Add to Shortlist button and remove the separate heart button (it did the same job). Remove the old passive method chips; keep the full branding text underneath as a reference.
- `shortlist.tsx` / `ShortlistQuoteForm.tsx`: show the choices on each line. Fill the line's decoration with the chosen methods (still editable) and add colour and extras to the notes. `submitShortlistQuote` creates one quote line for each chosen branding option, so each one can be priced.
- Quick view (`ProductQuickView.tsx`): change "Quote this item" to "Add to Shortlist" as well, so the wording matches.
- Check it in the browser on the Nomad Bottle: pick a colour, two branding options and the gift box, add to the shortlist, then confirm the choices show there and in the submitted request.
