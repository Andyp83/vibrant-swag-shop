import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";

import { listAdminAuditEvents } from "@/lib/backoffice/audit.functions";

export const Route = createFileRoute("/_authenticated/admin/audit-log")({
  component: AuditLogPage,
});

const ACTION_LABELS: Record<string, string> = {
  role_granted: "Admin role granted",
  role_changed: "Role changed",
  role_revoked: "Admin role revoked",
  admin_access_denied: "Admin access denied",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function AuditLogPage() {
  const listFn = useServerFn(listAdminAuditEvents);
  const query = useQuery({ queryKey: ["admin-audit-log"], queryFn: () => listFn({}) });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every admin permission and access-rule change, with the actor and timestamp.
        </p>
      </header>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading entries…
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Could not load the audit log.</p>
      ) : (query.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((entry) => (
                <tr key={entry.id} className="border-t align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatWhen(entry.occurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {entry.action === "admin_access_denied" ? (
                        <ShieldAlert className="size-4 text-destructive" />
                      ) : null}
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <div className="text-xs text-muted-foreground">{entry.entityType}</div>
                  </td>
                  <td className="px-4 py-3">
                    {entry.actorEmail ?? entry.actorUserId ?? "system"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.entityLabel ?? entry.entityId ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <pre className="max-w-[28rem] overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {JSON.stringify(
                        {
                          ...(entry.details ?? {}),
                          ...(entry.beforeState ? { before: entry.beforeState } : {}),
                          ...(entry.afterState ? { after: entry.afterState } : {}),
                        },
                        null,
                        1,
                      )}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
