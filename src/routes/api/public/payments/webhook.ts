import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

type CheckoutSession = {
  id?: string;
  metadata?: { invoiceId?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  payment_intent?: string | null;
};

/**
 * Settles an invoice through a single atomic, idempotent database call. The
 * function re-checks the signed event's mode, the session binding, the amount
 * and currency, and the invoice's current state before marking it paid.
 */
async function markInvoicePaid(session: CheckoutSession, env: StripeEnv) {
  const invoiceId = session?.metadata?.invoiceId;
  const sessionId = session?.id;
  if (!invoiceId || !sessionId) return;

  // Only a completed payment may settle an invoice.
  const status = session.payment_status ?? "";
  if (status !== "paid" && status !== "no_payment_required") return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("settle_invoice_payment", {
    p_invoice_id: invoiceId,
    p_session_id: sessionId,
    p_amount_cents: Number(session.amount_total ?? 0),
    p_currency: String(session.currency ?? "aud").toUpperCase(),
    p_provider_reference: String(session.payment_intent ?? sessionId),
    p_environment: env,
  });

  if (error) {
    console.error("Invoice settlement failed", error.message);
    return;
  }
  if (data && data !== "paid" && data !== "already_paid") {
    console.warn("Invoice settlement rejected:", data);
  }
}

async function markPaymentFailed(session: CheckoutSession, env: StripeEnv) {
  const invoiceId = session?.metadata?.invoiceId;
  const sessionId = session?.id;
  if (!invoiceId || !sessionId) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("mark_invoice_payment_failed", {
    p_invoice_id: invoiceId,
    p_session_id: sessionId,
    p_environment: env,
  });
  if (error) console.error("Payment failure handling failed", error.message);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await markInvoicePaid(event.data.object as CheckoutSession, env);
      break;
    case "checkout.session.async_payment_failed":
      await markPaymentFailed(event.data.object as CheckoutSession, env);
      break;
    default:
      console.log("Unhandled payment event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          // rawEnv only selects which signing secret must verify the event; the
          // invoice's own recorded mode decides whether it may be settled.
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Payment webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
