import { emailShell, sendEmail, siteOrigin } from "@/lib/backoffice/email.server";

/** Minutes a fresh brief stays eligible for its one confirmation email. */
const WINDOW_MINUTES = 30;

/**
 * Emails the person who submitted a brief a confirmation with a secure,
 * single-use sign-in link straight to their quote timeline. Sends at most once
 * per request, and only for briefs submitted moments ago.
 */
export async function sendQuoteRequestConfirmation(requestId: string): Promise<{ ok: boolean }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: request } = await supabaseAdmin
    .from("quote_requests")
    .select("id, name, email, product_interest, decoration, quantity, created_at, confirmation_sent_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.confirmation_sent_at) return { ok: false };
  const ageMs = Date.now() - new Date(request.created_at).getTime();
  if (!Number.isFinite(ageMs) || ageMs > WINDOW_MINUTES * 60_000) return { ok: false };

  // Claim the send first so a duplicate call can't fire a second email.
  const { data: claimed } = await supabaseAdmin
    .from("quote_requests")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", request.id)
    .is("confirmation_sent_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return { ok: false };

  const origin = siteOrigin();
  const portalUrl = `${origin}/portal`;
  let secureLink = `${origin}/auth`;

  try {
    const { data: link } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: request.email,
      options: { redirectTo: portalUrl },
    });
    if (link?.properties?.action_link) secureLink = link.properties.action_link;
  } catch {
    // No account yet (or link generation unavailable) — fall back to the sign-in page.
  }

  const details = [
    request.product_interest ? `Product interest: <strong>${escapeHtml(request.product_interest)}</strong>` : null,
    request.decoration ? `Branding method: <strong>${escapeHtml(request.decoration)}</strong>` : null,
    request.quantity ? `Quantity: <strong>${request.quantity}</strong>` : null,
  ].filter(Boolean);

  await sendEmail({
    to: request.email,
    subject: "We've got your brief — here's your quote timeline",
    template: "quote_request_confirmation",
    relatedType: "quote_request",
    relatedId: request.id,
    html: emailShell(
      "Your brief has landed",
      `<p>Hi ${escapeHtml(request.name)},</p>
       <p>Thanks for sending this through — our team is costing it now and you'll have a quote shortly.</p>
       ${details.length ? `<ul style="margin:16px 0;padding-left:18px">${details.map((d) => `<li>${d}</li>`).join("")}</ul>` : ""}
       <p><strong>What happens next</strong></p>
       <ol style="margin:8px 0 0;padding-left:18px">
         <li>Brief received — done</li>
         <li>Quote prepared and sent to you</li>
         <li>Artwork proof for your sign-off</li>
         <li>Production and delivery updates</li>
       </ol>
       <p style="margin-top:20px">Use the secure link below to sign in and follow every stage in your client portal. It confirms your email address at the same time, and expires shortly for your security.</p>`,
      { label: "View your quote timeline", url: secureLink },
    ),
  });

  return { ok: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
