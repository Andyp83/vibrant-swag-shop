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

export type PortalResult =
  | { linked: false; verified: boolean; email: string }
  | ({ linked: true; verified: true } & PortalData);

export const getPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalResult> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) return { linked: false, verified: false, email };
    const { findCustomerByEmail, loadPortalData } = await import("@/lib/portal/portal.server");
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { linked: false, verified: true, email };
    return { linked: true, verified: true, ...(await loadPortalData(customer)) };
  });

export const decideQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalQuoteDecisionSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) return { ok: false };
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
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) {
      return { ok: false, error: "Confirm your email address first." };
    }
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
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) {
      return { error: "Confirm your email address first." };
    }
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
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) return { ok: false };
    const { findCustomerByEmail, saveUpload } = await import("@/lib/portal/portal.server");
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { ok: false };
    return { ok: await saveUpload(customer.id, data) };
  });

export type PortalDocument = { fileName: string; base64: string } | { error: string };

export const getProofDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalDocumentSchema.parse(input))
  .handler(async ({ data, context }): Promise<PortalDocument> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) {
      return { error: "Confirm your email address first." };
    }
    const { findCustomerByEmail, buildProofCertificate } = await import(
      "@/lib/portal/portal.server"
    );
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { error: "No account match" };
    const doc = await buildProofCertificate(customer, data.id);
    return doc ?? { error: "Proof not found" };
  });

export const getInvoiceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portalDocumentSchema.parse(input))
  .handler(async ({ data, context }): Promise<PortalDocument> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) {
      return { error: "Confirm your email address first." };
    }
    const { findCustomerByEmail, buildInvoiceDocument } = await import(
      "@/lib/portal/portal.server"
    );
    const customer = email ? await findCustomerByEmail(email) : null;
    if (!customer) return { error: "No account match" };
    const doc = await buildInvoiceDocument(customer, data.id);
    return doc ?? { error: "Invoice not found" };
  });
