import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase,
  Copy,
  FileText,
  Loader2,
  Plus,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
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
import { invoicesFromQuote } from "@/lib/backoffice/billing.functions";
import { centsToInput, computeQuoteTotals, formatDate, formatMoney, parseMoneyToCents } from "@/lib/backoffice/format";
import {
  customerFromRequest,
  deleteQuote,
  jobFromQuote,
  listCustomers,
  listQuotes,
  listRequests,
  saveQuote,
  sendQuote,
  updateRequest,
} from "@/lib/backoffice/quotes.functions";
import { quoteRequestStatuses, statusLabels, type QuoteLineItem } from "@/lib/backoffice/types";

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  head: () => ({
    meta: [
      { title: "Quotes | See See Bloom back office" },
      {
        name: "description",
        content: "Answer enquiries, build priced quotes and send them for online acceptance.",
      },
      { property: "og:title", content: "Quotes | See See Bloom back office" },
      { property: "og:description", content: "Answer enquiries and send priced quotes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuotesPage,
});

type QuoteDraft = {
  id?: string;
  customer_id: string;
  request_id: string | null;
  currency: string;
  setup: string;
  freight: string;
  discount: string;
  tax_rate: string;
  valid_until: string;
  terms: string;
  notes: string;
  line_items: (Omit<QuoteLineItem, "id" | "amount_cents"> & { unit_price: string })[];
};

function emptyLine(sort: number) {
  return {
    description: "",
    product: "",
    decoration: "",
    quantity: 100,
    unit_price: "0.00",
    unit_price_cents: 0,
    sort_order: sort,
  };
}

function newDraft(customerId = "", requestId: string | null = null): QuoteDraft {
  return {
    customer_id: customerId,
    request_id: requestId,
    currency: "AUD",
    setup: "0.00",
    freight: "0.00",
    discount: "0.00",
    tax_rate: "10",
    valid_until: "",
    terms: "50% deposit to begin production. Balance due before dispatch.",
    notes: "",
    line_items: [emptyLine(0)],
  };
}

function QuotesPage() {
  const queryClient = useQueryClient();
  const requestsFn = useServerFn(listRequests);
  const quotesFn = useServerFn(listQuotes);
  const customersFn = useServerFn(listCustomers);
  const updateRequestFn = useServerFn(updateRequest);
  const convertFn = useServerFn(customerFromRequest);
  const saveQuoteFn = useServerFn(saveQuote);
  const sendQuoteFn = useServerFn(sendQuote);
  const deleteQuoteFn = useServerFn(deleteQuote);
  const jobFn = useServerFn(jobFromQuote);
  const invoicesFn = useServerFn(invoicesFromQuote);

  const [draft, setDraft] = useState<QuoteDraft | null>(null);

  const requests = useQuery({ queryKey: ["admin-requests"], queryFn: () => requestsFn({}) });
  const quotes = useQuery({ queryKey: ["admin-quotes"], queryFn: () => quotesFn({}) });
  const customers = useQuery({ queryKey: ["admin-customers"], queryFn: () => customersFn({}) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const setRequestStatus = useMutation({
    mutationFn: (input: { id: string; status: string; admin_notes: string }) =>
      updateRequestFn({
        data: { id: input.id, status: input.status as "new", admin_notes: input.admin_notes },
      }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const convert = useMutation({
    mutationFn: (id: string) => convertFn({ data: { id } }),
    onSuccess: (customer, requestId) => {
      toast.success(`${customer.name} added to customers`);
      setDraft(newDraft(customer.id, requestId));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: (input: QuoteDraft) =>
      saveQuoteFn({
        data: {
          ...(input.id ? { id: input.id } : {}),
          customer_id: input.customer_id,
          request_id: input.request_id,
          currency: input.currency,
          setup_cents: parseMoneyToCents(input.setup),
          freight_cents: parseMoneyToCents(input.freight),
          discount_cents: parseMoneyToCents(input.discount),
          tax_rate: Number(input.tax_rate) || 0,
          valid_until: input.valid_until || null,
          terms: input.terms,
          notes: input.notes,
          line_items: input.line_items.map((line, index) => ({
            description: line.description,
            product: line.product,
            decoration: line.decoration,
            quantity: Number(line.quantity) || 1,
            unit_price_cents: parseMoneyToCents(line.unit_price),
            sort_order: index,
          })),
        },
      }),
    onSuccess: () => {
      toast.success("Quote saved");
      setDraft(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const send = useMutation({
    mutationFn: (id: string) => sendQuoteFn({ data: { id } }),
    onSuccess: (result) => {
      if (result.sent) toast.success("Quote emailed to the customer");
      else toast.warning(result.error ?? "Quote marked as sent, but the email didn't go out");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeQuote = useMutation({
    mutationFn: (id: string) => deleteQuoteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Quote deleted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createJob = useMutation({
    mutationFn: (id: string) => jobFn({ data: { id } }),
    onSuccess: (job) => {
      toast.success(`Job ${job.number} opened`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createInvoices = useMutation({
    mutationFn: (id: string) => invoicesFn({ data: { id, depositPercent: 50 } }),
    onSuccess: (result) => {
      toast.success(`${result.created} invoice${result.created > 1 ? "s" : ""} drafted`);
      void queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const totals = draft
    ? computeQuoteTotals({
        lineItems: draft.line_items.map((line) => ({
          quantity: Number(line.quantity) || 0,
          unit_price_cents: parseMoneyToCents(line.unit_price),
        })),
        setup_cents: parseMoneyToCents(draft.setup),
        freight_cents: parseMoneyToCents(draft.freight),
        discount_cents: parseMoneyToCents(draft.discount),
        tax_rate: Number(draft.tax_rate) || 0,
      })
    : null;

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-lg font-semibold">Enquiry inbox</h2>
        {requests.isLoading ? (
          <Loader2 className="mt-4 size-5 animate-spin" />
        ) : (
          <div className="mt-4 space-y-4">
            {(requests.data ?? []).map((request) => (
              <article key={request.id} className="rounded-2xl border p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {request.name}
                      {request.company ? ` · ${request.company}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.email}
                      {request.phone ? ` · ${request.phone}` : ""} · {formatDate(request.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={request.status}
                      onValueChange={(value) =>
                        setRequestStatus.mutate({
                          id: request.id,
                          status: value,
                          admin_notes: request.admin_notes,
                        })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {quoteRequestStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => convert.mutate(request.id)}
                      disabled={convert.isPending}
                    >
                      <UserPlus className="size-4" />
                      Quote this
                    </Button>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Detail label="Product" value={request.product_interest} />
                  <Detail label="Quantity" value={request.quantity ? String(request.quantity) : null} />
                  <Detail label="Decoration" value={request.decoration} />
                  <Detail label="Needed by" value={request.required_by} />
                </dl>
                {request.notes ? (
                  <p className="mt-3 whitespace-pre-line text-sm">{request.notes}</p>
                ) : null}
                {request.file_paths.length ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {request.file_paths.length} artwork file(s) attached
                  </p>
                ) : null}
              </article>
            ))}
            {(requests.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            ) : null}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quotes</h2>
          <Button onClick={() => setDraft(newDraft())}>
            <Plus className="size-4" />
            New quote
          </Button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Valid until</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(quotes.data ?? []).map((quote) => (
                <tr key={quote.id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{quote.number}</td>
                  <td className="px-4 py-3">
                    {quote.customer?.company || quote.customer?.name || "—"}
                  </td>
                  <td className="px-4 py-3">{formatMoney(quote.total_cents, quote.currency)}</td>
                  <td className="px-4 py-3">{statusLabels[quote.status] ?? quote.status}</td>
                  <td className="px-4 py-3">{formatDate(quote.valid_until)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDraft({
                            id: quote.id,
                            customer_id: quote.customer_id,
                            request_id: quote.request_id,
                            currency: quote.currency,
                            setup: centsToInput(quote.setup_cents),
                            freight: centsToInput(quote.freight_cents),
                            discount: centsToInput(quote.discount_cents),
                            tax_rate: String(quote.tax_rate),
                            valid_until: quote.valid_until ?? "",
                            terms: quote.terms,
                            notes: quote.notes,
                            line_items: (quote.line_items ?? []).map((line, index) => ({
                              description: line.description,
                              product: line.product,
                              decoration: line.decoration,
                              quantity: line.quantity,
                              unit_price: centsToInput(line.unit_price_cents),
                              unit_price_cents: line.unit_price_cents,
                              sort_order: index,
                            })),
                          })
                        }
                      >
                        <FileText className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => send.mutate(quote.id)}
                        disabled={send.isPending}
                      >
                        <Send className="size-4" />
                        Send
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(
                            `${window.location.origin}/q/${quote.share_token}`,
                          );
                          toast.success("Customer link copied");
                        }}
                      >
                        <Copy className="size-4" />
                        Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => createJob.mutate(quote.id)}
                        disabled={createJob.isPending}
                      >
                        <Briefcase className="size-4" />
                        Job
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => createInvoices.mutate(quote.id)}
                        disabled={createInvoices.isPending}
                      >
                        Invoice
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuote.mutate(quote.id)}
                        disabled={removeQuote.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(quotes.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                    No quotes yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit quote" : "Build a quote"}</DialogTitle>
          </DialogHeader>

          {draft ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <Label>Valid until</Label>
                  <Input
                    type="date"
                    value={draft.valid_until}
                    onChange={(event) => setDraft({ ...draft, valid_until: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Line items</Label>
                {draft.line_items.map((line, index) => (
                  <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-12">
                    <Input
                      className="sm:col-span-5"
                      placeholder="Description"
                      value={line.description}
                      onChange={(event) => {
                        const next = [...draft.line_items];
                        next[index] = { ...line, description: event.target.value };
                        setDraft({ ...draft, line_items: next });
                      }}
                    />
                    <Input
                      className="sm:col-span-3"
                      placeholder="Decoration"
                      value={line.decoration}
                      onChange={(event) => {
                        const next = [...draft.line_items];
                        next[index] = { ...line, decoration: event.target.value };
                        setDraft({ ...draft, line_items: next });
                      }}
                    />
                    <Input
                      className="sm:col-span-2"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(event) => {
                        const next = [...draft.line_items];
                        next[index] = { ...line, quantity: Number(event.target.value) };
                        setDraft({ ...draft, line_items: next });
                      }}
                    />
                    <Input
                      className="sm:col-span-2"
                      placeholder="Unit price"
                      value={line.unit_price}
                      onChange={(event) => {
                        const next = [...draft.line_items];
                        next[index] = { ...line, unit_price: event.target.value };
                        setDraft({ ...draft, line_items: next });
                      }}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      line_items: [...draft.line_items, emptyLine(draft.line_items.length)],
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add line
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <MoneyField
                  label="Setup"
                  value={draft.setup}
                  onChange={(value) => setDraft({ ...draft, setup: value })}
                />
                <MoneyField
                  label="Freight"
                  value={draft.freight}
                  onChange={(value) => setDraft({ ...draft, freight: value })}
                />
                <MoneyField
                  label="Discount"
                  value={draft.discount}
                  onChange={(value) => setDraft({ ...draft, discount: value })}
                />
                <div className="space-y-2">
                  <Label>GST %</Label>
                  <Input
                    value={draft.tax_rate}
                    onChange={(event) => setDraft({ ...draft, tax_rate: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes for the customer</Label>
                <Textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms</Label>
                <Textarea
                  rows={3}
                  value={draft.terms}
                  onChange={(event) => setDraft({ ...draft, terms: event.target.value })}
                />
              </div>

              {totals ? (
                <div className="rounded-xl bg-muted/50 p-4 text-sm">
                  <p>Subtotal {formatMoney(totals.subtotal_cents, draft.currency)}</p>
                  <p>GST {formatMoney(totals.tax_cents, draft.currency)}</p>
                  <p className="mt-1 text-lg font-semibold">
                    Total {formatMoney(totals.total_cents, draft.currency)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => draft && save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
