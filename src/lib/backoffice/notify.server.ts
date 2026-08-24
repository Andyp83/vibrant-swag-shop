import { emailShell, sendEmail, siteOrigin } from "@/lib/backoffice/email.server";

/** Where internal alerts land — override with the ADMIN_EMAIL secret. */
function adminEmail(): string {
  return process.env["ADMIN_EMAIL"] ?? "andy@seeseebloom.com.au";
}

/** Emails the studio and confirms to the customer when a quote is accepted or declined. */
export async function notifyQuoteDecision(quoteId: string, decision: "accept" | "decline") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("quotes")
    .select("id, number, total_cents, currency, share_token, customer:customers(name, email, company)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!data) return;

  const quote = data as unknown as {
    id: string;
    number: string;
    total_cents: number | null;
    currency: string | null;
    share_token: string;
    customer: { name: string; email: string; company: string | null } | null;
  };
  const accepted = decision === "accept";
  const who = quote.customer?.company || quote.customer?.name || "A customer";
  const origin = siteOrigin();

  await sendEmail({
    to: adminEmail(),
    subject: `Quote ${quote.number} ${accepted ? "accepted" : "declined"} by ${who}`,
    template: accepted ? "quote_accepted_admin" : "quote_declined_admin",
    relatedType: "quote",
    relatedId: quote.id,
    html: emailShell(
      `Quote ${quote.number} ${accepted ? "accepted" : "declined"}`,
      `<p><strong>${who}</strong> has ${accepted ? "accepted" : "declined"} quote <strong>${quote.number}</strong>.</p>`,
      { label: "Open in admin", url: `${origin}/admin/quotes` },
    ),
  });

  if (!quote.customer?.email) return;
  await sendEmail({
    to: quote.customer.email,
    subject: accepted
      ? `Thanks — quote ${quote.number} is accepted`
      : `Quote ${quote.number} marked as declined`,
    template: accepted ? "quote_accepted_customer" : "quote_declined_customer",
    relatedType: "quote",
    relatedId: quote.id,
    html: emailShell(
      accepted ? `Quote ${quote.number} accepted` : `Quote ${quote.number} declined`,
      `<p>Hi ${quote.customer.name},</p><p>${
        accepted
          ? "Thanks for the green light — we're opening your job now and will be in touch with artwork proofs shortly."
          : "No problem at all. We've closed this quote off; just reply if you'd like it revised."
      }</p>`,
      { label: "Open your portal", url: `${origin}/portal` },
    ),
  });
}

/** Emails the studio (and confirms to the customer) after a proof is signed or sent back. */
export async function notifyProofResponse(
  proofId: string,
  decision: "approve" | "changes",
  options: { signedName?: string; note?: string } = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("proofs")
    .select("id, version, job:jobs(id, number, title, share_token, customer:customers(name, email, company))")
    .eq("id", proofId)
    .maybeSingle();
  if (!data) return;

  const proof = data as unknown as {
    id: string;
    version: number;
    job: {
      id: string;
      number: string;
      title: string;
      share_token: string;
      customer: { name: string; email: string; company: string | null } | null;
    } | null;
  };
  if (!proof.job) return;

  const approved = decision === "approve";
  const who = options.signedName || proof.job.customer?.name || "The customer";
  const origin = siteOrigin();

  await sendEmail({
    to: adminEmail(),
    subject: approved
      ? `Proof v${proof.version} signed for ${proof.job.number}`
      : `Changes requested on proof v${proof.version} for ${proof.job.number}`,
    template: approved ? "proof_signed_admin" : "proof_changes_admin",
    relatedType: "proof",
    relatedId: proof.id,
    html: emailShell(
      approved ? `Proof v${proof.version} signed off` : `Changes requested on proof v${proof.version}`,
      `<p><strong>${who}</strong> ${
        approved ? "signed off" : "requested changes on"
      } proof v${proof.version} for <strong>${proof.job.number} — ${proof.job.title}</strong>.</p>${
        options.note ? `<p><em>${options.note}</em></p>` : ""
      }`,
      { label: "Open the job", url: `${origin}/admin/jobs` },
    ),
  });

  if (!proof.job.customer?.email) return;
  await sendEmail({
    to: proof.job.customer.email,
    subject: approved
      ? `Proof v${proof.version} approved — ${proof.job.number}`
      : `Change request received — ${proof.job.number}`,
    template: approved ? "proof_signed_customer" : "proof_changes_customer",
    relatedType: "proof",
    relatedId: proof.id,
    html: emailShell(
      approved ? `Thanks for signing off proof v${proof.version}` : `We're on your changes`,
      `<p>Hi ${proof.job.customer.name},</p><p>${
        approved
          ? `Your approval of proof v${proof.version} is recorded${
              options.signedName ? ` under the name ${options.signedName}` : ""
            }. We're moving <strong>${proof.job.number}</strong> into production and will keep you posted on each stage.`
          : `We've received your change request on proof v${proof.version} for <strong>${proof.job.number}</strong> and will send a revised proof shortly.`
      }</p>`,
      { label: "Track this job", url: `${origin}/job/${proof.job.share_token}` },
    ),
  });
}
