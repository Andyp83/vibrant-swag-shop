import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { listEmailLog } from "@/lib/backoffice/billing.functions";
import { formatDate, formatMoney } from "@/lib/backoffice/format";
import { getDashboard } from "@/lib/backoffice/quotes.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Back office dashboard | See See Bloom" },
      {
        name: "description",
        content: "See See Bloom studio dashboard: quotes, jobs, proofs and payments at a glance.",
      },
      { property: "og:title", content: "Back office dashboard | See See Bloom" },
      { property: "og:description", content: "Quotes, jobs, proofs and payments at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const dashboardFn = useServerFn(getDashboard);
  const emailFn = useServerFn(listEmailLog);
  const summary = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => dashboardFn({}) });
  const emails = useQuery({ queryKey: ["admin-emails"], queryFn: () => emailFn({}) });

  if (summary.isLoading) {
    return <Loader2 className="size-5 animate-spin" />;
  }

  const data = summary.data;

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New enquiries" value={String(data?.newRequests ?? 0)} to="/admin/quotes" />
        <Stat
          label="Quotes out"
          value={String(data?.openQuotes ?? 0)}
          hint={formatMoney(data?.quotedValueCents ?? 0)}
          to="/admin/quotes"
        />
        <Stat label="Jobs due this week" value={String(data?.jobsDueSoon ?? 0)} to="/admin/jobs" />
        <Stat
          label="Proofs awaiting approval"
          value={String(data?.proofsAwaiting ?? 0)}
          to="/admin/jobs"
        />
        <Stat
          label="Unpaid invoices"
          value={String(data?.unpaidInvoices ?? 0)}
          hint={formatMoney(data?.unpaidValueCents ?? 0)}
          to="/admin/invoices"
        />
        <Stat
          label="Paid this month"
          value={formatMoney(data?.paidThisMonthCents ?? 0)}
          to="/admin/invoices"
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent customer emails</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(emails.data ?? []).map((row: Record<string, unknown>) => (
                <tr key={String(row["id"])} className="border-t">
                  <td className="px-4 py-3">{formatDate(String(row["created_at"]))}</td>
                  <td className="px-4 py-3">{String(row["to_email"])}</td>
                  <td className="px-4 py-3">{String(row["subject"])}</td>
                  <td className="px-4 py-3">{String(row["status"])}</td>
                </tr>
              ))}
              {(emails.data ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                    Nothing sent yet. Connect your email domain to start sending quotes, proofs and
                    reminders.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  to: "/admin/quotes" | "/admin/jobs" | "/admin/invoices";
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border p-5 transition-colors hover:border-foreground/40 hover:bg-muted/40"
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </Link>
  );
}
