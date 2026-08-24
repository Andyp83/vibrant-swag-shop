import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  portalDocumentSchema,
  portalProofSignSchema,
  portalQuoteDecisionSchema,
  portalUploadRecordSchema,
  portalUploadTicketSchema,
} from "@/lib/portal/schemas";
import type { PortalData } from "@/lib/portal/portal.server";

export type PortalResult = { linked: false; email: string } | ({ linked: true } & PortalData);

export const getPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalResult> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { findCustomerByEmail, loadPortalData } = await import("@/lib/portal/portal.server");
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { linked: false, email };
    return { linked: true, ...(await loadPortalData(customer)) };
  });

export const decideQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalQuoteDecisionSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { findCustomerByEmail, recordQuoteDecision } = await import(
      "@/lib/portal/portal.server"
    );
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { ok: false };
    return { ok: await recordQuoteDecision(customer.id, data.quoteId, data.decision) };
  });

export const signProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalProofSignSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    if (data.decision === "approve" && data.signedName.length < 2) {
      return { ok: false, error: "Type your full name to sign off this proof." };
    }
    const email = String((context.claims as { email?: string }).email ?? "");
    const { findCustomerByEmail, recordProofSignature } = await import(
      "@/lib/portal/portal.server"
    );
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { ok: false, error: "No account match" };
    return { ok: await recordProofSignature(customer.id, data) };
  });

export const startUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalUploadTicketSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ path: string; token: string } | { error: string }> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { findCustomerByEmail, createUploadTicket } = await import("@/lib/portal/portal.server");
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { error: "No account match" };
    return createUploadTicket(customer.id, data.fileName);
  });

export const finishUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalUploadRecordSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { findCustomerByEmail, saveUpload } = await import("@/lib/portal/portal.server");
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { ok: false };
    return { ok: await saveUpload(customer.id, data) };
  });
