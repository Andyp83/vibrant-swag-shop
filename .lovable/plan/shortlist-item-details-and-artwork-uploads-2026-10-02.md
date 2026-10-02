# Shortlist item details and artwork uploads

## What will change

- Show each shortlisted product’s catalogue image beside its name and details.
- Show that product’s available colours on the shortlist and allow one colour to be selected or changed there.
- Add high-resolution logo/design upload controls to every shortlist item.
- Add a “Use the same artwork as the previous item” checkbox from the second item onward, so customers do not need to upload the same file repeatedly.
- For T-shirts, jumpers and similar apparel, show separate Front and Back decoration selections and artwork uploads. Either side can be left blank.
- Keep quantity and extra-information fields on each line and retain the single submit action at the end.

## Submission behaviour

- Upload chosen artwork securely when the shortlist is submitted, rather than while customers are still editing.
- Associate each uploaded file with its item and placement in the saved request notes, while retaining the existing request-level file list for staff and the client portal.
- When “same artwork as previous item” is selected, reference the prior item’s files without uploading duplicates.
- Validate allowed high-resolution artwork formats and the existing 25 MB per-file limit, with clear messages before submission.
- Preserve one ordered quantity per item even when multiple branding options are selected.

## Technical details

- Extend shortlist entries with product image, available colours, and per-item artwork/placement state while remaining compatible with existing saved shortlists.
- Pass the selected product image and colour list from full product pages and quick view into the shortlist.
- Update the shortlist submission function to accept validated uploaded file paths and save them on the quote request.
- Reuse the existing private quote-artwork storage and portal/back-office file display flow; no new public file access.
- Detect apparel from its catalogue category/subcategory and expose Front/Back controls only for applicable products.
- Add focused tests for artwork inheritance, apparel front/back handling, and one-quantity-per-item quote lines; then verify desktop and mobile shortlist submission in the preview.
