import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/backoffice/format";
import { deleteCustomer, listCustomers, saveCustomer } from "@/lib/backoffice/quotes.functions";
import type { Customer } from "@/lib/backoffice/types";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers | See See Bloom back office" },
      {
        name: "description",
        content: "Store customer contact details, companies and account notes in one place.",
      },
      { property: "og:title", content: "Customers | See See Bloom back office" },
      { property: "og:description", content: "Customer records for the See See Bloom studio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});

type Draft = Partial<Customer>;

function CustomersPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCustomers);
  const saveFn = useServerFn(saveCustomer);
  const deleteFn = useServerFn(deleteCustomer);
  const [draft, setDraft] = useState<Draft | null>(null);

  const customers = useQuery({ queryKey: ["admin-customers"], queryFn: () => listFn({}) });

  const save = useMutation({
    mutationFn: (input: Draft) =>
      saveFn({
        data: {
          ...(input.id ? { id: input.id } : {}),
          name: input.name ?? "",
          company: input.company ?? null,
          email: input.email ?? "",
          phone: input.phone ?? null,
          notes: input.notes ?? "",
        },
      }),
    onSuccess: () => {
      toast.success("Customer saved");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Customer removed");
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customers</h2>
        <Button onClick={() => setDraft({ notes: "" })}>
          <Plus className="size-4" />
          New customer
        </Button>
      </div>

      {customers.isLoading ? (
        <Loader2 className="mt-6 size-5 animate-spin" />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(customers.data ?? []).map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3">{customer.company ?? "—"}</td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">{customer.phone ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(customer.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDraft(customer)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(customer.id)}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(customers.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                    No customers yet — convert an enquiry from the Quotes tab.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit customer" : "New customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Name" htmlFor="customer-name">
              <Input
                id="customer-name"
                value={draft?.name ?? ""}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field label="Company" htmlFor="customer-company">
              <Input
                id="customer-company"
                value={draft?.company ?? ""}
                onChange={(event) => setDraft({ ...draft, company: event.target.value })}
              />
            </Field>
            <Field label="Email" htmlFor="customer-email">
              <Input
                id="customer-email"
                type="email"
                value={draft?.email ?? ""}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </Field>
            <Field label="Phone" htmlFor="customer-phone">
              <Input
                id="customer-phone"
                value={draft?.phone ?? ""}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            </Field>
            <Field label="Notes" htmlFor="customer-notes">
              <Textarea
                id="customer-notes"
                rows={4}
                value={draft?.notes ?? ""}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => draft && save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
