import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function markInvoicePaid(session: any, env: StripeEnv) {
  const invoiceId = session?.metadata?.invoiceId as string | undefined;
  if (!invoiceId) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const amount = (session.amount_total ?? 0) as number;
  const currency = ((session.currency ?? "aud") as string).toUpperCase();

  await supabaseAdmin
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId);

  await supabaseAdmin.from("payments").insert({
    invoice_id: invoiceId,
    amount_cents: amount,
    currency,
    provider: "stripe",
    provider_reference: session.payment_intent ?? session.id ?? null,
    status: "succeeded",
    environment: env,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") await markInvoicePaid(session, env);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await markInvoicePaid(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed": {
      const invoiceId = event.data.object?.metadata?.invoiceId as string | undefined;
      if (invoiceId) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("invoices").update({ status: "overdue" }).eq("id", invoiceId);
      }
      break;
    }
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
