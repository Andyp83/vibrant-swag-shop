import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Download, FileText, Loader2, LogOut, Mail, MessageSquare, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/backoffice/format";
import { jobStages, statusLabels } from "@/lib/backoffice/types";
import {
  decideQuote,
  finishUpload,
  getInvoiceDocument,
  getPortal,
  getProofDocument,
  signProof,
  startUpload,
} from "@/lib/portal/portal.functions";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Client Portal | See See Bloom" },
      {
        name: "description",
        content:
          "Track your See See Bloom quotes, upload artwork, sign off proofs and follow your order through production.",
      },
      { property: "og:title", content: "Client Portal | See See Bloom" },
      {
        property: "og:description",
        content: "Quotes, proofs, order status and invoices in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});

function StageBar({ stage }: { stage: string }) {
  const current = jobStages.indexOf(stage as (typeof jobStages)[number]);
  return (
    <ol className="mt-4 flex flex-wrap gap-2">
      {jobStages.map((s, i) => (
        <li
          key={s}
          className={`rounded-full border px-3 py-1 text-xs ${
            i <= current
              ? "border-transparent bg-foreground text-background"
              : "border-border text-muted-foreground"
          }`}
        >
          {statusLabels[s] ?? s}
        </li>
      ))}
    </ol>
  );
}

function PortalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPortal = useServerFn(getPortal);
  const decide = useServerFn(decideQuote);
  const sign = useServerFn(signProof);
  const beginUpload = useServerFn(startUpload);
  const completeUpload = useServerFn(finishUpload);
  const fetchProofDoc = useServerFn(getProofDocument);
  const fetchInvoiceDoc = useServerFn(getInvoiceDocument);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadJob, setUploadJob] = useState("");
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyDoc, setBusyDoc] = useState<string | null>(null);

  async function openDocument(
    kind: "proof" | "invoice",
    id: string,
    action: "download" | "view",
  ) {
    setBusyDoc(id);
    try {
      const result = await (kind === "proof" ? fetchProofDoc : fetchInvoiceDoc)({ data: { id } });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const binary = atob(result.base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      if (action === "view") {
        window.open(url, "_blank", "noopener");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = result.fileName;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("We couldn't prepare that document. Please try again.");
    } finally {
      setBusyDoc(null);
    }
  }


  const portalQuery = useQuery({ queryKey: ["portal"], queryFn: () => fetchPortal({}) });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const quoteMutation = useMutation({
    mutationFn: (vars: { quoteId: string; decision: "accept" | "decline" }) =>
      decide({ data: vars }),
    onSuccess: (result, vars) => {
      if (!result.ok) {
        toast.error("That quote can no longer be changed — please contact us.");
        return;
      }
      toast.success(vars.decision === "accept" ? "Quote accepted — thank you!" : "Quote declined");
      void portalQuery.refetch();
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const proofMutation = useMutation({
    mutationFn: (vars: { proofId: string; decision: "approve" | "changes" }) =>
      sign({
        data: {
          proofId: vars.proofId,
          decision: vars.decision,
          signedName: signatures[vars.proofId] ?? "",
          note: notes[vars.proofId] ?? "",
        },
      }),
    onSuccess: (result, vars) => {
      if (!result.ok) {
        toast.error(result.error ?? "We couldn't record that.");
        return;
      }
      toast.success(
        vars.decision === "approve" ? "Proof signed — into production it goes" : "Change request sent",
      );
      void portalQuery.refetch();
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Choose a file first");
      if (file.size > 25 * 1024 * 1024) throw new Error("Files must be 25MB or smaller");
      const ticket = await beginUpload({ data: { fileName: file.name } });
      if ("error" in ticket) throw new Error(ticket.error);
      const { error } = await supabase.storage
        .from("quote-uploads")
        .uploadToSignedUrl(ticket.path, ticket.token, file);
      if (error) throw new Error(error.message);
      const saved = await completeUpload({
        data: {
          path: ticket.path,
          fileName: file.name,
          notes: uploadNotes,
          jobId: uploadJob || null,
        },
      });
      if (!saved.ok) throw new Error("Upload could not be saved");
    },
    onSuccess: () => {
      toast.success("Artwork received — we'll be in touch");
      if (fileRef.current) fileRef.current.value = "";
      setUploadNotes("");
      void portalQuery.refetch();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Upload failed. Please try again."),
  });

  if (portalQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const data = portalQuery.data;

  if (data && !data.verified) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="display-type text-3xl">Confirm your email</h1>
        <p className="mt-4 text-muted-foreground">
          We've sent a confirmation link to <strong>{data.email}</strong>. Click it to unlock your
          portal, then refresh this page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            className="rounded-full"
            onClick={async () => {
              const { error } = await supabase.auth.resend({ type: "signup", email: data.email });
              if (error) toast.error(error.message);
              else toast.success("Confirmation email sent — check your inbox.");
            }}
          >
            Resend confirmation email
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => void portalQuery.refetch()}
          >
            I've confirmed
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  if (!data || !data.linked) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="display-type text-3xl">No orders linked yet</h1>
        <p className="mt-4 text-muted-foreground">
          We couldn't find any quotes or orders for <strong>{data?.email}</strong>. Send us a quote
          request with this email address and your portal will fill up automatically.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/quote">Request a quote</Link>
          </Button>
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }


  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client portal</p>
          <h1 className="display-type mt-2 text-3xl">
            {data.customer.company || data.customer.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.customer.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/email-preferences">
              <Mail className="size-4" />
              Email preferences
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Quotes */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Your quotes</h2>
        {data.quotes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No quotes yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {data.quotes.map((quote) => (
              <article key={quote.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{quote.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(quote.total_cents, quote.currency)} · valid until{" "}
                      {formatDate(quote.valid_until)}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    {statusLabels[quote.status] ?? quote.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to="/q/$token" params={{ token: quote.share_token }}>
                      View quote
                    </Link>
                  </Button>
                  {quote.status === "sent" && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={quoteMutation.isPending}
                        onClick={() =>
                          quoteMutation.mutate({ quoteId: quote.id, decision: "accept" })
                        }
                      >
                        <Check className="size-4" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={quoteMutation.isPending}
                        onClick={() =>
                          quoteMutation.mutate({ quoteId: quote.id, decision: "decline" })
                        }
                      >
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">Order status</h2>
        {data.jobs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No orders in production yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {data.jobs.map((job) => (
              <article key={job.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {job.number} · {job.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(job.due_date)}
                      {job.tracking_number ? ` · Tracking ${job.tracking_number}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    {statusLabels[job.stage] ?? job.stage}
                  </span>
                </div>
                <StageBar stage={job.stage} />
                {job.timeline.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                    {job.timeline.map((event, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 text-muted-foreground">
                          {formatDate(event.created_at)}
                        </span>
                        <span>{event.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Proofs */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">Proofs to sign</h2>
        {data.proofs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No proofs yet.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {data.proofs.map((proof) => (
              <article key={proof.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {proof.job_number} · Proof v{proof.version}
                    </p>
                    <p className="text-sm text-muted-foreground">{proof.job_title}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    {statusLabels[proof.status] ?? proof.status}
                  </span>
                </div>

                {proof.image_url && (
                  <img
                    src={proof.image_url}
                    alt={`Artwork proof version ${proof.version} for ${proof.job_title}`}
                    className="mt-4 w-full rounded-lg border border-border bg-background object-contain"
                  />
                )}
                {proof.notes && <p className="mt-3 text-sm">{proof.notes}</p>}

                {proof.status === "approved" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Signed by {proof.signed_name || "you"} on {formatDate(proof.signed_at)}.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={busyDoc === proof.id}
                      onClick={() => void openDocument("proof", proof.id, "download")}
                    >
                      <Download className="size-4" />
                      {busyDoc === proof.id ? "Preparing…" : "Download signed proof (PDF)"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3 border-t border-border pt-5">
                    <div className="space-y-2">
                      <Label htmlFor={`sign-${proof.id}`}>Type your full name to sign off</Label>
                      <Input
                        id={`sign-${proof.id}`}
                        maxLength={120}
                        placeholder="Jane Smith"
                        value={signatures[proof.id] ?? ""}
                        onChange={(e) =>
                          setSignatures((prev) => ({ ...prev, [proof.id]: e.target.value }))
                        }
                      />
                    </div>
                    <Textarea
                      rows={2}
                      maxLength={1000}
                      placeholder="Any changes you need (optional)"
                      value={notes[proof.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [proof.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={proofMutation.isPending}
                        onClick={() =>
                          proofMutation.mutate({ proofId: proof.id, decision: "approve" })
                        }
                      >
                        <Check className="size-4" /> Approve &amp; sign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={proofMutation.isPending}
                        onClick={() =>
                          proofMutation.mutate({ proofId: proof.id, decision: "changes" })
                        }
                      >
                        <MessageSquare className="size-4" /> Request changes
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Signing records your name and the date and time as your approval.
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Uploads */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">Send us artwork</h2>
        <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="portal-file">Logo or artwork file (max 25MB)</Label>
            <Input id="portal-file" type="file" ref={fileRef} />
          </div>
          {data.jobs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="portal-job">Related order (optional)</Label>
              <select
                id="portal-job"
                value={uploadJob}
                onChange={(e) => setUploadJob(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Not order specific</option>
                {data.jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.number} · {job.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Textarea
            rows={3}
            maxLength={1000}
            placeholder="Notes for our studio (optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
          />
          <Button
            className="rounded-full"
            disabled={uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload artwork
          </Button>
          {data.uploads.length > 0 && (
            <ul className="border-t border-border pt-4 text-sm">
              {data.uploads.map((upload) => (
                <li key={upload.id} className="flex justify-between gap-3 py-1">
                  <span>{upload.file_name}</span>
                  <span className="text-muted-foreground">{formatDate(upload.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Invoices */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">Invoices</h2>
        {data.invoices.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {data.invoices.map((invoice) => (
              <article
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div>
                  <p className="font-semibold">{invoice.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(invoice.amount_cents, invoice.currency)} · due{" "}
                    {formatDate(invoice.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border px-3 py-1 text-xs">
                    {statusLabels[invoice.status] ?? invoice.status}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={busyDoc === invoice.id}
                    onClick={() => void openDocument("invoice", invoice.id, "view")}
                  >
                    <FileText className="size-4" />
                    {busyDoc === invoice.id ? "Preparing…" : "View invoice"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    disabled={busyDoc === invoice.id}
                    onClick={() => void openDocument("invoice", invoice.id, "download")}
                  >
                    <Download className="size-4" /> PDF
                  </Button>
                  {invoice.status !== "paid" && invoice.status !== "void" && (
                    <Button asChild size="sm" className="rounded-full">
                      <Link to="/pay/$token" params={{ token: invoice.share_token }}>
                        Pay now
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
