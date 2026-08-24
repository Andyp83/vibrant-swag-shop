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
  options: { signedName?: string | undefined; note?: string | undefined } = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("proofs")
    .select(
      "id, version, status, notes, response_note, signed_name, signed_at, file_path, job:jobs(id, number, title, share_token, customer:customers(name, email, company))",
    )
    .eq("id", proofId)
    .maybeSingle();
  if (!data) return;

  const proof = data as unknown as {
    id: string;
    version: number;
    status: string;
    notes: string;
    response_note: string;
    signed_name: string;
    signed_at: string | null;
    file_path: string;
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

  // Attach a signed-proof certificate so the customer keeps a record of what they approved.
  let certificate: { filename: string; contentBase64: string } | undefined;
  if (approved) {
    try {
      let artwork: { bytes: Uint8Array; contentType: string } | null = null;
      const lower = (proof.file_path ?? "").toLowerCase();
      if (/\.(png|jpe?g)$/.test(lower)) {
        const { data: file } = await supabaseAdmin.storage.from("proofs").download(proof.file_path);
        if (file) {
          artwork = {
            bytes: new Uint8Array(await file.arrayBuffer()),
            contentType: lower.endsWith(".png") ? "image/png" : "image/jpeg",
          };
        }
      }
      const { renderProofCertificate } = await import("@/lib/backoffice/pdf.server");
      const base64 = await renderProofCertificate({
        jobNumber: proof.job.number,
        jobTitle: proof.job.title,
        version: proof.version,
        status: proof.status,
        notes: proof.notes,
        responseNote: proof.response_note,
        signedName: options.signedName || proof.signed_name,
        signedAt: proof.signed_at,
        customer: {
          name: proof.job.customer.name,
          company: proof.job.customer.company,
          email: proof.job.customer.email,
        },
        artwork,
      });
      certificate = {
        filename: `${proof.job.number}-proof-v${proof.version}.pdf`,
        contentBase64: base64,
      };
    } catch (certError) {
      console.error("Proof certificate build failed", certError);
    }
  }

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
    ...(certificate ? { attachment: certificate } : {}),
  });
}

type RequestStage = "new" | "in_progress" | "quoted" | "won" | "lost";

const REQUEST_STAGE_COPY: Record<RequestStage, { subject: string; heading: string; body: string } | null> = {
  new: null,
  in_progress: {
    subject: "We're working on your quote",
    heading: "Your brief is with our team",
    body: "Thanks for your brief — one of our merch specialists is pricing it up now. We'll be in touch shortly with options, decoration methods and lead times.",
  },
  quoted: {
    subject: "Your quote is ready",
    heading: "Your quote is ready to review",
    body: "We've prepared a quote for your brief. Sign in to your portal to review the pricing, decoration and timings, then accept online when you're happy.",
  },
  won: {
    subject: "You're approved — your job is underway",
    heading: "Your job is underway",
    body: "Your quote is accepted and your job is now open. Next up we'll prepare artwork proofs for your sign-off, then move straight into production.",
  },
  lost: {
    subject: "We've closed off your quote",
    heading: "Quote closed",
    body: "We've closed this brief off for now. If anything changes — quantities, timings or budget — just reply and we'll happily revise it.",
  },
};

/** Emails the customer when their quote request moves to a new stage. */
export async function notifyRequestStage(requestId: string, status: RequestStage) {
  const copy = REQUEST_STAGE_COPY[status];
  if (!copy) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("quote_requests")
    .select("id, name, email, product_interest")
    .eq("id", requestId)
    .maybeSingle();
  if (!data?.email) return;

  const request = data as { id: string; name: string; email: string; product_interest: string | null };

  await sendEmail({
    to: request.email,
    subject: `${copy.subject} — See See Bloom`,
    template: `request_stage_${status}`,
    relatedType: "quote_request",
    relatedId: request.id,
    html: emailShell(
      copy.heading,
      `<p>Hi ${request.name},</p><p>${copy.body}</p>${
        request.product_interest ? `<p><strong>Brief:</strong> ${request.product_interest}</p>` : ""
      }`,
      { label: "Open your portal", url: `${siteOrigin()}/portal` },
    ),
  });
}
