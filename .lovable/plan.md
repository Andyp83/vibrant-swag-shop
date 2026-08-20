# See See Bloom back office

A full admin back office behind your existing single-admin login: answer quotes, produce priced quotes, track jobs, send proofs, take payments and chase overdue invoices — plus the catalogue upload tools you already have.

## What you'll get

**Sign in** — keep the current single-admin login at `/auth`; everything below lives under `/admin/*` and is admin-only.

**Dashboard** — new quotes to answer, jobs due this week, proofs awaiting approval, unpaid invoices, and revenue-in-progress.

**Quote inbox** — every submitted brief in one list with status (New, In progress, Quoted, Won, Lost), the customer's artwork files, and their answers (product, quantity, decoration, deadline, budget, notes). Open a brief, add internal notes, assign a status.

**Customers** — a record per company/person: contact details, all their quotes, jobs and invoices in one place. Created automatically from a brief, editable by hand.

**Produce quotes** — build a priced quote from a brief: line items (product, decoration, quantity, unit price), setup fees, freight, tax, discount, validity date, terms. Totals calculate live. Each quote gets a number (e.g. SSB-1042) and a shareable customer link where they can view and accept or decline it. Emailed to the customer as a branded email with a PDF attached.

**Jobs + tracking** — accepting a quote (or one click from a quote) creates a job with stages: Artwork → Proof → Approved → Production → Shipped → Delivered. Job list filterable by stage and due date, with overdue highlighting. Each job has a timeline of events, internal notes, supplier/PO reference and a tracking number you can share.

**Proofs** — upload a proof image/PDF against a job, email it to the customer, and they approve or request changes from a link (no login). Approvals and change requests land back on the job timeline; proofs are versioned (v1, v2, …).

**Payments** — issue an invoice (deposit or full) from a quote or job, with an online card checkout link via Stripe. Paid status updates automatically when Stripe confirms. Overdue invoices show in a chase list; send a payment reminder email in one click.

**Emails** — quote sent, proof ready, invoice, payment reminder, receipt — all branded See See Bloom templates. Real email delivery needs a sending domain verified for the project; until then, sends go to your own address in test mode. I'll flag exactly what to verify.

**Catalogue** — the existing category/product editor with image upload stays, moved into the new admin shell alongside the other sections.

## Customer-facing additions

Three public, no-login links: view/accept a quote, approve a proof, pay an invoice. Each opens via an unguessable token tied to the record.

## Technical notes

- Database: new tables `customers`, `quotes`, `quote_line_items`, `jobs`, `job_events`, `proofs`, `invoices`, `payments`, plus `share_tokens`; enums for statuses/stages. All in `public` with GRANTs, RLS enabled, admin-only via `has_role(auth.uid(), 'admin')`. `quote_requests` gains admin SELECT/UPDATE and a `customer_id`/`status` link. Storage: private `proofs` bucket; existing `quote-uploads` reused.
- Server logic: `createServerFn` under `src/lib/backoffice/*.functions.ts` with `requireSupabaseAuth` for all admin reads/writes; role checked in-handler. Public token routes are TanStack routes that resolve a token server-side and never expose admin data.
- Stripe: enabled via the Stripe integration; checkout sessions created server-side, webhook at `src/routes/api/public/stripe-webhook.ts` with signature verification updating invoice/payment rows.
- Email: transactional templates sent from server functions; requires a verified sending domain plus its secret.
- PDFs: quote/invoice PDFs generated with the already-installed `pdf-lib`.
- UI: `/admin` shell with sidebar sections (Dashboard, Quotes, Customers, Jobs, Proofs, Invoices, Catalogue), each a route under `src/routes/_authenticated/admin/`. Existing spectrum design tokens, no new colours.

## Build order

1. Schema + admin shell and dashboard
2. Quote inbox + customers
3. Quote builder, PDF, public accept link, quote email
4. Jobs + tracking + timeline
5. Proofs upload, proof email, public approval link
6. Invoices, Stripe checkout + webhook, reminders
7. Catalogue moved into the shell, end-to-end check
