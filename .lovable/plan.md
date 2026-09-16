# Design portal for print clients

Right now a print client can send a brief and see a one-line status in their portal. This turns each brief into a working page they can open: read back exactly what they sent, see where it's up to, add files after the fact, and swap notes with you.

## What the client gets

**Brief page** (opened from "Your briefs" in the portal)
- Everything they submitted, laid out clearly: what they want printed, quantity, decoration/finish, deadline, budget, notes, and the date sent.
- Progress trail: Brief received → Being costed → Quote sent → Order placed, with the current step highlighted and the date it happened.
- Their quote, when you've sent one: number, total, and a button to open and accept it.
- Files list: everything attached to the brief (from the original form and anything added later), each openable via a private, time-limited link.
- Add files: drag/choose a file, optional note, uploads straight against that brief. Same 25 MB cap and private storage as the existing portal uploads.
- Message box: a short note that lands against the brief for you to read in the quote inbox.

**Portal list** — each brief row becomes a link to its page, showing the current step, file count and quote number.

**Print brief form** (`/design`) — gains file attaching at submission time (currently sends an empty file list), and after sending, links the client straight to the brief page when they're signed in.

## What you get in admin

The quote inbox brief view gains the client's later uploads and messages in one activity list, so files added after submission don't get lost.

## Technical notes

- New table `public.quote_request_activity` (id, request_id → quote_requests, kind `upload` | `message`, file_path, file_name, notes, created_by uuid, created_at) with GRANTs, RLS on, admin-all via `has_role`, plus select/insert for the authenticated owner matched through the brief's email. Files go to the existing private `quote-uploads` bucket under `brief/<request_id>/`.
- New server fns in `src/lib/portal/brief.functions.ts` (+ `brief.server.ts` helpers), all behind `requireSupabaseAuth` and the existing email-verification check: `getBrief` (brief + activity + signed file URLs + linked quote, ownership by email match), `startBriefUpload`/`finishBriefUpload` (signed upload URL then activity row), `postBriefMessage`. Zod schemas in `src/lib/portal/schemas.ts`.
- New route `src/routes/_authenticated/briefs/$id.tsx`; brief rows in `portal.tsx` become links to it. Reuses the portal's existing stage bar, status labels and upload flow.
- `design.tsx` submit path gains the same signed-upload step used by the quote form, filling `file_paths` on insert.
- Both new pages stay `noindex`; existing brief loading (`loadRequestsByEmail`) is extended with an activity count rather than replaced.

## Not included

Proof sign-off on briefs (that stays on jobs), and any change to how quotes, jobs or invoices work.
