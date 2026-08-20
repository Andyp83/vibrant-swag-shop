import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, Copy, Loader2, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  listInvoices,
  listPayments,
  saveInvoice,
  sendInvoice,
  setInvoiceStatus,
} from "@/lib/backoffice/billing.functions";
import { centsToInput, formatDate, formatMoney, parseMoneyToCents } from "@/lib/backoffice/format";
import { listCustomers } from "@/lib/backoffice/quotes.functions";
import { invoiceStatuses, statusLabels } from "@/lib/backoffice/types";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices & payments | See See Bloom back office" },
      {
        name: "description",
        content: "Issue invoices, send payment reminders and reconcile card payments online.",
      },
      { property: "og:title", content: "Invoices & payments | See See Bloom back office" },
      { property: "og:description", content: "Issue invoices and take card payments online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoicesPage,
});

type Draft = {
  id?: string;
  customer_id: string;
  kind: string;
  description: string;
  amount: string;
  due_date: string;
};

function InvoicesPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listInvoices);
  const paymentsFn = useServerFn(listPayments);
  const customersFn = useServerFn(listCustomers);
  const saveFn = useServerFn(saveInvoice);
  const sendFn = useServerFn(sendInvoice);
  const statusFn = useServerFn(setInvoiceStatus);
  const [draft, setDraft] = useState<Draft | null>(null);

  const invoices = useQuery({ queryKey: ["admin-invoices"], queryFn: () => listFn({}) });
  const payments = useQuery({ queryKey: ["admin-payments"], queryFn: () => paymentsFn({}) });
  const customers = useQuery({ queryKey: ["admin-customers"], queryFn: () => customersFn({}) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const save = useMutation({
    mutationFn: (input: Draft) =>
      saveFn({
        data: {
          ...(input.id ? { id: input.id } : {}),
          customer_id: input.customer_id,
          quote_id: null,
          job_id: null,
          kind: input.kind as "full",
          description: input.description,
          amount_cents: parseMoneyToCents(input.amount),
          currency: "AUD",
          due_date: input.due_date || null,
        },
      }),
    onSuccess: () => {
      toast.success("Invoice saved");
      setDraft(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const send = useMutation({
    mutationFn: (input: { id: string; reminder: boolean }) =>
      sendFn({ data: { id: input.id, reminder: input.reminder } }),
    onSuccess: (result) => {
      if (result.sent) toast.success("Email sent");
      else toast.warning(result.error ?? "Invoice marked as sent, but the email didn't go out");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: (input: { id: string; status: string }) =>
      statusFn({ data: { id: input.id, status: input.status as "draft" } }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-14">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invoices</h2>
          <Button
            onClick={() =>
              setDraft({
                customer_id: "",
                kind: "full",
                description: "",
                amount: "0.00",
                due_date: "",
              })
            }
          >
            <Plus className="size-4" />
            New invoice
          </Button>
        </div>

        {invoices.isLoading ? (
          <Loader2 className="mt-4 size-5 animate-spin" />
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(invoices.data ?? []).map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{invoice.number}</td>
                    <td className="px-4 py-3">
                      {invoice.customer?.company || invoice.customer?.name || "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">{invoice.kind}</td>
                    <td className="px-4 py-3">
                      {formatMoney(invoice.amount_cents, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">{formatDate(invoice.due_date)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => setStatus.mutate({ id: invoice.id, status: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {invoiceStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {statusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDraft({
                              id: invoice.id,
                              customer_id: invoice.customer_id,
                              kind: invoice.kind,
                              description: invoice.description,
                              amount: centsToInput(invoice.amount_cents),
                              due_date: invoice.due_date ?? "",
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => send.mutate({ id: invoice.id, reminder: false })}
                          disabled={send.isPending}
                        >
                          <Send className="size-4" />
                          Send
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => send.mutate({ id: invoice.id, reminder: true })}
                          disabled={send.isPending}
                        >
                          <BellRing className="size-4" />
                          Remind
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void navigator.clipboard.writeText(
                              `${window.location.origin}/pay/${invoice.share_token}`,
                            );
                            toast.success("Payment link copied");
                          }}
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(invoices.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                      No invoices yet — raise them from an accepted quote or add one manually.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payments received</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Environment</th>
              </tr>
            </thead>
            <tbody>
              {(payments.data ?? []).map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="px-4 py-3">{formatDate(payment.created_at)}</td>
                  <td className="px-4 py-3">{payment.invoice?.number ?? "—"}</td>
                  <td className="px-4 py-3">
                    {formatMoney(payment.amount_cents, payment.currency)}
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.provider}</td>
                  <td className="px-4 py-3 capitalize">{payment.environment}</td>
                </tr>
              ))}
              {(payments.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit invoice" : "New invoice"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={draft.customer_id}
                  onValueChange={(value) => setDraft({ ...draft, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers.data ?? []).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Kind</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(value) => setDraft({ ...draft, kind: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    value={draft.amount}
                    onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={draft.due_date}
                    onChange={(event) => setDraft({ ...draft, due_date: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => draft && save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
