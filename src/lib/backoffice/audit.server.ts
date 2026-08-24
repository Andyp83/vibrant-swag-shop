import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuditEventInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  details?: Record<string, unknown>;
};

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  beforeState: unknown;
  afterState: unknown;
  details: Record<string, unknown>;
};

/**
 * Appends an entry to the admin audit log. Never throws: an audit write must
 * not break the action it is recording, but failures are logged server-side.
 */
export async function recordAuditEvent(event: AuditEventInput): Promise<void> {
  const { error } = await supabaseAdmin.from("admin_audit_log").insert({
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    entity_label: event.entityLabel ?? null,
    actor_user_id: event.actorUserId ?? null,
    actor_email: event.actorEmail ?? null,
    before_state: (event.beforeState ?? null) as never,
    after_state: (event.afterState ?? null) as never,
    details: (event.details ?? {}) as never,
  });
  if (error) console.error("[audit] failed to record event", event.action, error.message);
}

/** Reads the most recent audit entries, newest first. */
export async function listAuditEvents(limit = 200): Promise<AuditEvent[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_audit_log")
    .select(
      "id, occurred_at, actor_user_id, actor_email, action, entity_type, entity_id, entity_label, before_state, after_state, details",
    )
    .order("occurred_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    beforeState: row.before_state,
    afterState: row.after_state,
    details: (row.details ?? {}) as Record<string, unknown>,
  }));
}
