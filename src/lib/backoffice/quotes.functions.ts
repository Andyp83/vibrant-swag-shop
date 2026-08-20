import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeQuoteTotals } from "@/lib/backoffice/format";
import { assertAdmin } from "@/lib/backoffice/guard";
import { customerSchema, quoteSchema, requestStatusSchema, uuid } from "@/lib/backoffice/schemas";
import type {
  Customer,
  DashboardSummary,
  Quote,
  QuoteRequestRow,
} from "@/lib/backoffice/types";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardSummary> => {
    await assertAdmin(context);
    const db = context.supabase;
    const soon = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [requests, quotes, jobs, proofs, invoices, payments] = await Promise.all([
      db.from("quote_requests").select("id").eq("status", "new"),
      db.from("quotes").select("status,total_cents"),
      db.from("jobs").select("id,due_date,stage").lte("due_date", soon),
      db.from("proofs").select("id").eq("status", "sent"),
      db.from("invoices").select("status,amount_cents"),
      db.from("payments").select("amount_cents,created_at").gte("created_at", monthStart),
    ]);

    const openQuotes = (quotes.data ?? []).filter((q) => q.status === "sent");
    const unpaid = (invoices.data ?? []).filter(
      (i) => i.status === "sent" || i.status === "overdue",
    );

    return {
      newRequests: requests.data?.length ?? 0,
      openQuotes: openQuotes.length,
      quotedValueCents: openQuotes.reduce((sum, q) => sum + (q.total_cents ?? 0), 0),
      jobsDueSoon: (jobs.data ?? []).filter((j) => j.stage !== "delivered").length,
      proofsAwaiting: proofs.data?.length ?? 0,
      unpaidInvoices: unpaid.length,
      unpaidValueCents: unpaid.reduce((sum, i) => sum + (i.amount_cents ?? 0), 0),
      paidThisMonthCents: (payments.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
    };
  });

export const listRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QuoteRequestRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as QuoteRequestRow[];
  });

export const updateRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => requestStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("quote_requests")
      .update({ status: data.status, admin_notes: data.admin_notes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Customer[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Customer[];
  });

export const saveCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerSchema.parse(input))
  .handler(async ({ data, context }): Promise<Customer> => {
    await assertAdmin(context);
    const payload = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
    };
    const query = data.id
      ? context.supabase.from("customers").update(payload).eq("id", data.id).select("*").single()
      : context.supabase.from("customers").insert(payload).select("*").single();
    const { data: row, error } = await query;
    if (error) throw new Error(error.message);
    return row as unknown as Customer;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Creates (or reuses) a customer record from an inbound quote request. */
export const customerFromRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }): Promise<Customer> => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: request, error } = await db
      .from("quote_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !request) throw new Error(error?.message ?? "Request not found");

    const { data: existing } = await db
      .from("customers")
      .select("*")
      .ilike("email", request.email)
      .maybeSingle();

    let customer = existing as unknown as Customer | null;
    if (!customer) {
      const { data: created, error: createError } = await db
        .from("customers")
        .insert({
          name: request.name,
          company: request.company,
          email: request.email,
          phone: request.phone,
          notes: request.notes ?? "",
        })
        .select("*")
        .single();
      if (createError) throw new Error(createError.message);
      customer = created as unknown as Customer;
    }

    await db
      .from("quote_requests")
      .update({ customer_id: customer.id, status: "in_progress" })
      .eq("id", data.id);

    return customer;
  });

export const listQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Quote[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("quotes")
      .select("*, customer:customers(*), line_items:quote_line_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Quote[];
  });

export const saveQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quoteSchema.parse(input))
  .handler(async ({ data, context }): Promise<Quote> => {
    await assertAdmin(context);
    const db = context.supabase;
    const totals = computeQuoteTotals({
      lineItems: data.line_items,
      setup_cents: data.setup_cents,
      freight_cents: data.freight_cents,
      discount_cents: data.discount_cents,
      tax_rate: data.tax_rate,
    });

    const payload = {
      customer_id: data.customer_id,
      request_id: data.request_id,
      currency: data.currency,
      discount_cents: data.discount_cents,
      freight_cents: data.freight_cents,
      setup_cents: data.setup_cents,
      tax_rate: data.tax_rate,
      valid_until: data.valid_until || null,
      terms: data.terms,
      notes: data.notes,
      ...totals,
    };

    const { data: quote, error } = await (data.id
      ? db.from("quotes").update(payload).eq("id", data.id).select("*").single()
      : db.from("quotes").insert(payload).select("*").single());
    if (error || !quote) throw new Error(error?.message ?? "Could not save quote");

    await db.from("quote_line_items").delete().eq("quote_id", quote.id);
    const { error: lineError } = await db.from("quote_line_items").insert(
      data.line_items.map((item, index) => ({
        quote_id: quote.id,
        description: item.description,
        product: item.product,
        decoration: item.decoration,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        amount_cents: item.quantity * item.unit_price_cents,
        sort_order: item.sort_order || index,
      })),
    );
    if (lineError) throw new Error(lineError.message);

    if (data.request_id) {
      await db.from("quote_requests").update({ status: "quoted" }).eq("id", data.request_id);
    }

    return quote as unknown as Quote;
  });

export const deleteQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("quotes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Emails the quote to the customer with a PDF attached and a link to accept online. */
export const sendQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }): Promise<{ sent: boolean; error?: string }> => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: quote, error } = await db
      .from("quotes")
      .select("*, customer:customers(*), line_items:quote_line_items(*)")
      .eq("id", data.id)
      .single();
    if (error || !quote) throw new Error(error?.message ?? "Quote not found");

    const record = quote as unknown as Quote;
    const customer = record.customer;
    if (!customer) throw new Error("Quote has no customer");

    const { renderQuoteDocument } = await import("@/lib/backoffice/pdf.server");
    const { sendEmail, emailShell, siteOrigin } = await import("@/lib/backoffice/email.server");

    const pdf = await renderQuoteDocument({
      kind: "Quote",
      number: record.number,
      currency: record.currency,
      issuedOn: new Date().toLocaleDateString("en-AU"),
      dueLabel: "Valid until",
      dueOn: record.valid_until,
      customer: { name: customer.name, company: customer.company, email: customer.email },
      lines: (record.line_items ?? []).map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unit_price_cents: line.unit_price_cents,
        amount_cents: line.amount_cents,
      })),
      setup_cents: record.setup_cents,
      freight_cents: record.freight_cents,
      discount_cents: record.discount_cents,
      tax_rate: record.tax_rate,
      tax_cents: record.tax_cents,
      total_cents: record.total_cents,
      terms: record.terms,
      notes: record.notes,
    });

    const url = `${siteOrigin()}/q/${record.share_token}`;
    const result = await sendEmail({
      to: customer.email,
      subject: `Your See See Bloom quote ${record.number}`,
      template: "quote_sent",
      relatedType: "quote",
      relatedId: record.id,
      html: emailShell(
        `Quote ${record.number}`,
        `<p>Hi ${customer.name},</p><p>Thanks for the brief — your quote is attached and ready to review online. It totals <strong>${record.currency} ${(record.total_cents / 100).toFixed(2)}</strong>${record.valid_until ? ` and is valid until ${record.valid_until}` : ""}.</p>`,
        { label: "Review and accept", url },
      ),
      attachment: { filename: `${record.number}.pdf`, contentBase64: pdf },
    });

    await db
      .from("quotes")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", record.id);

    return result;
  });

/** Turns an accepted quote into a live job. */
export const jobFromQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: quote, error } = await db
      .from("quotes")
      .select("id, number, customer_id, line_items:quote_line_items(description)")
      .eq("id", data.id)
      .single();
    if (error || !quote) throw new Error(error?.message ?? "Quote not found");

    const first = (quote as { line_items?: { description: string }[] }).line_items?.[0];
    const { data: job, error: jobError } = await db
      .from("jobs")
      .insert({
        customer_id: quote.customer_id,
        quote_id: quote.id,
        title: first?.description ?? `Job from ${quote.number}`,
      })
      .select("id, number")
      .single();
    if (jobError || !job) throw new Error(jobError?.message ?? "Could not create job");

    await db.from("job_events").insert({
      job_id: job.id,
      kind: "created",
      message: `Job opened from quote ${quote.number}`,
    });

    return { id: job.id, number: job.number };
  });
