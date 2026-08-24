import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/backoffice/guard";
import { invoiceSchema, uuid } from "@/lib/backoffice/schemas";
import type { Invoice } from "@/lib/backoffice/types";

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Invoice[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("invoices")
      .select("*, customer:customers(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Invoice[];
  });

export const saveInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => invoiceSchema.parse(input))
  .handler(async ({ data, context }): Promise<Invoice> => {
    await assertAdmin(context);
    const payload = {
      customer_id: data.customer_id,
      quote_id: data.quote_id,
      job_id: data.job_id,
      kind: data.kind,
      description: data.description,
      amount_cents: data.amount_cents,
      currency: data.currency,
      due_date: data.due_date || null,
    };
    const { data: invoice, error } = await (data.id
      ? context.supabase.from("invoices").update(payload).eq("id", data.id).select("*").single()
      : context.supabase.from("invoices").insert(payload).select("*").single());
    if (error || !invoice) throw new Error(error?.message ?? "Could not save invoice");
    return invoice as unknown as Invoice;
  });

export const setInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = input as { id: string; status: string };
    return { id: uuid.parse(raw.id), status: String(raw.status) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const allowed = ["draft", "sent", "paid", "overdue", "void"];
    if (!allowed.includes(data.status)) throw new Error("Invalid status");
    const { data: existing } = await context.supabase
      .from("invoices")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("invoices")
      .update({
        status: data.status as "draft",
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // An invoice leaving draft is "available" — send it to the customer automatically.
    if (data.status === "sent" && existing?.status !== "sent") {
      try {
        const { notifyInvoiceAvailable } = await import("@/lib/backoffice/notify.server");
        await notifyInvoiceAvailable(data.id);
      } catch (notifyError) {
        console.error("Invoice notification failed", notifyError);
      }
    }
    return { ok: true };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Emails an invoice (or a payment reminder) with a pay-online link and PDF. */
export const sendInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = input as { id: string; reminder?: boolean };
    return { id: uuid.parse(raw.id), reminder: Boolean(raw.reminder) };
  })
  .handler(async ({ data, context }): Promise<{ sent: boolean; error?: string }> => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: invoice, error } = await db
      .from("invoices")
      .select("*, customer:customers(*)")
      .eq("id", data.id)
      .single();
    if (error || !invoice) throw new Error(error?.message ?? "Invoice not found");

    const record = invoice as unknown as Invoice;
    const customer = record.customer;
    if (!customer) throw new Error("Invoice has no customer");

    const { renderQuoteDocument } = await import("@/lib/backoffice/pdf.server");
    const { sendEmail, emailShell, siteOrigin } = await import("@/lib/backoffice/email.server");

    const pdf = await renderQuoteDocument({
      kind: "Invoice",
      number: record.number,
      currency: record.currency,
      issuedOn: new Date().toLocaleDateString("en-AU"),
      dueLabel: "Due",
      dueOn: record.due_date,
      customer: { name: customer.name, company: customer.company, email: customer.email },
      lines: [
        {
          description: record.description || `${record.kind} payment`,
          quantity: 1,
          unit_price_cents: record.amount_cents,
          amount_cents: record.amount_cents,
        },
      ],
      total_cents: record.amount_cents,
      terms: "Payment can be made securely online using the link in your email.",
    });

    const amount = `${record.currency} ${(record.amount_cents / 100).toFixed(2)}`;
    const result = await sendEmail({
      to: customer.email,
      subject: data.reminder
        ? `Reminder: invoice ${record.number} is awaiting payment`
        : `Invoice ${record.number} from See See Bloom`,
      template: data.reminder ? "invoice_reminder" : "invoice_sent",
      relatedType: "invoice",
      relatedId: record.id,
      html: emailShell(
        data.reminder ? `Friendly reminder — ${record.number}` : `Invoice ${record.number}`,
        `<p>Hi ${customer.name},</p><p>${data.reminder ? "Just a nudge that this invoice is still open" : "Here is your invoice"}: <strong>${amount}</strong>${record.due_date ? `, due ${record.due_date}` : ""}. You can pay securely by card online.</p>`,
        { label: "Pay online", url: `${siteOrigin()}/pay/${record.share_token}` },
      ),
      attachment: { filename: `${record.number}.pdf`, contentBase64: pdf },
    });

    await db
      .from("invoices")
      .update({
        status: record.status === "paid" ? "paid" : "sent",
        ...(data.reminder ? { last_reminder_at: new Date().toISOString() } : {}),
      })
      .eq("id", record.id);

    return result;
  });

/** Creates a deposit + final invoice pair from an accepted quote. */
export const invoicesFromQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = input as { id: string; depositPercent?: number };
    return {
      id: uuid.parse(raw.id),
      depositPercent: Math.min(100, Math.max(0, Number(raw.depositPercent ?? 50))),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: quote, error } = await db
      .from("quotes")
      .select("id, number, customer_id, currency, total_cents")
      .eq("id", data.id)
      .single();
    if (error || !quote) throw new Error(error?.message ?? "Quote not found");

    const deposit = Math.round((quote.total_cents * data.depositPercent) / 100);
    const rows =
      deposit > 0 && deposit < quote.total_cents
        ? [
            { kind: "deposit", amount_cents: deposit, description: `Deposit for ${quote.number}` },
            {
              kind: "final",
              amount_cents: quote.total_cents - deposit,
              description: `Final payment for ${quote.number}`,
            },
          ]
        : [
            {
              kind: "full",
              amount_cents: quote.total_cents,
              description: `Payment for ${quote.number}`,
            },
          ];

    const { error: insertError } = await db.from("invoices").insert(
      rows.map((row) => ({
        customer_id: quote.customer_id,
        quote_id: quote.id,
        currency: quote.currency,
        status: "draft" as const,
        ...row,
      })),
    );
    if (insertError) throw new Error(insertError.message);
    return { created: rows.length };
  });

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("payments")
      .select("*, invoice:invoices(number, customer_id)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listEmailLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("email_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
