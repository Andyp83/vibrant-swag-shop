import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  briefIdSchema,
  briefMessageSchema,
  briefUploadRecordSchema,
  briefUploadTicketSchema,
} from "@/lib/portal/schemas";
import type { BriefDetail } from "@/lib/portal/brief.server";

export type BriefResult =
  | { ok: true; brief: BriefDetail }
  | { ok: false; error: string };

export const getBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => briefIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<BriefResult> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) {
      return { ok: false, error: "Confirm your email address first." };
    }
    const { loadBriefForEmail } = await import("@/lib/portal/brief.server");
    const brief = await loadBriefForEmail(email, data.id);
    if (!brief) return { ok: false, error: "We couldn't find that brief." };
    return { ok: true, brief };
  });

export const startBriefUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => briefUploadTicketSchema.parse(input))
  .handler(
    async ({ data, context }): Promise<{ path: string; token: string } | { error: string }> => {
      const email = String((context.claims as { email?: string }).email ?? "");
      const { isEmailVerified } = await import("@/lib/portal/verify.server");
      if (!(await isEmailVerified(context.supabase))) {
        return { error: "Confirm your email address first." };
      }
      const { createBriefUploadTicket } = await import("@/lib/portal/brief.server");
      return createBriefUploadTicket(email, data.requestId, data.fileName);
    },
  );

export const finishBriefUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => briefUploadRecordSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) return { ok: false };
    const { saveBriefActivity } = await import("@/lib/portal/brief.server");
    return {
      ok: await saveBriefActivity(email, context.userId, {
        requestId: data.requestId,
        kind: "upload",
        path: data.path,
        fileName: data.fileName,
        notes: data.notes,
      }),
    };
  });

export const postBriefMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => briefMessageSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const email = String((context.claims as { email?: string }).email ?? "");
    const { isEmailVerified } = await import("@/lib/portal/verify.server");
    if (!(await isEmailVerified(context.supabase))) return { ok: false };
    const { saveBriefActivity } = await import("@/lib/portal/brief.server");
    return {
      ok: await saveBriefActivity(email, context.userId, {
        requestId: data.requestId,
        kind: "message",
        notes: data.notes,
      }),
    };
  });
