import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/backoffice/guard";
import type { AuditEvent } from "@/lib/backoffice/audit.server";

export const listAdminAuditEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuditEvent[]> => {
    await assertAdmin(context);
    const { listAuditEvents } = await import("@/lib/backoffice/audit.server");
    return listAuditEvents(200);
  });
