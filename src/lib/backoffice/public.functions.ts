import { createServerFn } from "@tanstack/react-start";

import { proofResponseSchema, quoteResponseSchema, tokenSchema } from "@/lib/backoffice/schemas";

export type PublicQuote = {
  number: string;
  status: string;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  freight_cents: number;
  setup_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  valid_until: string | null;
  terms: string;
  notes: string;
  customer_name: string;
  company: string | null;
  lines: { description: string; quantity: number; unit_price_cents: number; amount_cents: number }[];
};

export type PublicProof = {
  version: number;
  status: string;
  notes: string;
  response_note: string;
  job_number: string;
  job_title: string;
  customer_name: string;
  image_url: string | null;
};

export type PublicInvoice = {
  number: string;
  status: string;
  kind: string;
  description: string;
  amount_cents: number;
  currency: string;
  due_date: string | null;
  customer_name: string;
};

export type PublicJob = {
  number: string;
  title: string;
  stage: string;
  due_date: string | null;
  tracking_number: string;
  customer_name: string;
  timeline: { message: string; created_at: string }[];
};

export const getSharedQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }): Promise<PublicQuote | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .select("*, customer:customers(name, company), line_items:quote_line_items(*)")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!quote) return null;
    const record = quote as unknown as {
      [key: string]: unknown;
      customer: { name: string; company: string | null } | null;
      line_items: {
        description: string;
        quantity: number;
        unit_price_cents: number;
        amount_cents: number;
        sort_order: number;
      }[];
    };
    return {
      number: record["number"] as string,
      status: record["status"] as string,
      currency: record["currency"] as string,
      subtotal_cents: record["subtotal_cents"] as number,
      discount_cents: record["discount_cents"] as number,
      freight_cents: record["freight_cents"] as number,
      setup_cents: record["setup_cents"] as number,
      tax_rate: Number(record["tax_rate"]),
      tax_cents: record["tax_cents"] as number,
      total_cents: record["total_cents"] as number,
      valid_until: (record["valid_until"] as string | null) ?? null,
      terms: (record["terms"] as string) ?? "",
      notes: (record["notes"] as string) ?? "",
      customer_name: record.customer?.name ?? "",
      company: record.customer?.company ?? null,
      lines: [...(record.line_items ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unit_price_cents: line.unit_price_cents,
          amount_cents: line.amount_cents,
        })),
    };
  });

export const respondToQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => quoteResponseSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .update(
        data.decision === "accept"
          ? { status: "accepted", accepted_at: now }
          : { status: "declined", declined_at: now },
      )
      .eq("share_token", data.token)
      .in("status", ["sent", "accepted", "declined"])
      .select("id, number, request_id")
      .maybeSingle();
    if (!quote) return { ok: false };

    if (quote.request_id) {
      await supabaseAdmin
        .from("quote_requests")
        .update({ status: data.decision === "accept" ? "won" : "lost" })
        .eq("id", quote.request_id);
    }

    const { notifyQuoteDecision } = await import("@/lib/backoffice/notify.server");
    await notifyQuoteDecision(quote.id as string, data.decision);
    return { ok: true };
  });

export const getSharedProof = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }): Promise<PublicProof | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: proof } = await supabaseAdmin
      .from("proofs")
      .select("*, job:jobs(number, title, customer:customers(name))")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!proof) return null;
    const record = proof as unknown as {
      version: number;
      status: string;
      notes: string;
      response_note: string;
      file_path: string;
      job: { number: string; title: string; customer: { name: string } | null } | null;
    };
    const { data: signed } = await supabaseAdmin.storage
      .from("proofs")
      .createSignedUrl(record.file_path, 3600);
    return {
      version: record.version,
      status: record.status,
      notes: record.notes,
      response_note: record.response_note,
      job_number: record.job?.number ?? "",
      job_title: record.job?.title ?? "",
      customer_name: record.job?.customer?.name ?? "",
      image_url: signed?.signedUrl ?? null,
    };
  });

export const respondToProof = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => proofResponseSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const approved = data.decision === "approve";
    const { data: proof } = await supabaseAdmin
      .from("proofs")
      .update({
        status: approved ? "approved" : "changes_requested",
        responded_at: new Date().toISOString(),
        response_note: data.note,
      })
      .eq("share_token", data.token)
      .select("id, job_id, version")
      .maybeSingle();
    if (!proof) return { ok: false };

    await supabaseAdmin
      .from("jobs")
      .update({ stage: approved ? "approved" : "artwork" })
      .eq("id", proof.job_id);
    await supabaseAdmin.from("job_events").insert({
      job_id: proof.job_id,
      kind: "proof",
      message: approved
        ? `Customer approved proof v${proof.version}`
        : `Customer requested changes on proof v${proof.version}${data.note ? `: ${data.note}` : ""}`,
    });

    const { notifyProofResponse } = await import("@/lib/backoffice/notify.server");
    await notifyProofResponse(proof.id as string, data.decision, { note: data.note });
    return { ok: true };
  });

export const getSharedJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }): Promise<PublicJob | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id, number, title, stage, due_date, tracking_number, customer:customers(name)")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!job) return null;
    const { data: events } = await supabaseAdmin
      .from("job_events")
      .select("message, created_at")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const customer = (job as unknown as { customer: { name: string } | null }).customer;
    return {
      number: job.number,
      title: job.title,
      stage: job.stage,
      due_date: job.due_date,
      tracking_number: job.tracking_number,
      customer_name: customer?.name ?? "",
      timeline: events ?? [],
    };
  });

export const getSharedInvoice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }): Promise<PublicInvoice | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select(
        "number, status, kind, description, amount_cents, currency, due_date, customer:customers(name)",
      )
      .eq("share_token", data.token)
      .maybeSingle();
    if (!invoice) return null;
    const customer = (invoice as unknown as { customer: { name: string } | null }).customer;
    return {
      number: invoice.number,
      status: invoice.status,
      kind: invoice.kind,
      description: invoice.description,
      amount_cents: invoice.amount_cents,
      currency: invoice.currency,
      due_date: invoice.due_date,
      customer_name: customer?.name ?? "",
    };
  });

/** Creates an embedded Stripe checkout session for an invoice share link. */
export const createInvoiceCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const raw = input as { token: string; environment: string; returnUrl: string };
    const parsed = tokenSchema.parse({ token: raw.token });
    if (raw.environment !== "sandbox" && raw.environment !== "live") {
      throw new Error("Invalid payment environment");
    }
    return {
      token: parsed.token,
      environment: raw.environment as "sandbox" | "live",
      returnUrl: String(raw.returnUrl).slice(0, 500),
    };
  })
  .handler(async ({ data }): Promise<{ clientSecret: string } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");

    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("id, number, description, amount_cents, currency, status, customer:customers(email)")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!invoice) return { error: "This payment link is no longer valid." };
    if (invoice.status === "paid") return { error: "This invoice has already been paid." };
    if (invoice.status === "void") return { error: "This invoice has been cancelled." };

    const email = (invoice as unknown as { customer: { email: string } | null }).customer?.email;

    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        line_items: [
          {
            price_data: {
              currency: invoice.currency.toLowerCase(),
              product_data: { name: invoice.description || `Invoice ${invoice.number}` },
              unit_amount: invoice.amount_cents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: { description: `Invoice ${invoice.number}` },
        ...(email ? { customer_email: email } : {}),
        metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
      });

      await supabaseAdmin
        .from("invoices")
        .update({ stripe_session_id: session.id })
        .eq("id", invoice.id);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
