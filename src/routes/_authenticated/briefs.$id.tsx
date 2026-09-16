import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/backoffice/format";
import { statusLabels } from "@/lib/backoffice/types";
import {
  finishBriefUpload,
  getBrief,
  postBriefMessage,
  startBriefUpload,
} from "@/lib/portal/brief.functions";

export const Route = createFileRoute("/_authenticated/briefs/$id")({
  head: () => ({
    meta: [
      { title: "Your brief | See See Bloom" },
      {
        name: "description",
        content:
          "Review your See See Bloom brief, follow its progress and send extra artwork to our studio.",
      },
      { property: "og:title", content: "Your brief | See See Bloom" },
      {
        property: "og:description",
        content: "Brief details, progress and artwork uploads in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BriefPage,
});

const briefStages = ["new", "in_progress", "quoted", "won"] as const;
const stageLabels: Record<string, string> = {
  new: "Brief received",
  in_progress: "Being costed",
  quoted: "Quote sent",
  won: "Order placed",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function BriefPage() {
  const { id } = Route.useParams();
  const fetchBrief = useServerFn(getBrief);
  const beginUpload = useServerFn(startBriefUpload);
  const completeUpload = useServerFn(finishBriefUpload);
  const sendMessage = useServerFn(postBriefMessage);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [message, setMessage] = useState("");

  const briefQuery = useQuery({
    queryKey: ["brief", id],
    queryFn: () => fetchBrief({ data: { id } }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Choose a file first");
      if (file.size > 25 * 1024 * 1024) throw new Error("Files must be 25MB or smaller");
      const ticket = await beginUpload({ data: { requestId: id, fileName: file.name } });
      if ("error" in ticket) throw new Error(ticket.error);
      const { error } = await supabase.storage
        .from("quote-uploads")
        .uploadToSignedUrl(ticket.path, ticket.token, file);
      if (error) throw new Error(error.message);
      const saved = await completeUpload({
        data: { requestId: id, path: ticket.path, fileName: file.name, notes: uploadNotes },
      });
      if (!saved.ok) throw new Error("Upload could not be saved");
    },
    onSuccess: () => {
      toast.success("File received — it's now with your brief");
      if (fileRef.current) fileRef.current.value = "";
      setUploadNotes("");
      void briefQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      const result = await sendMessage({ data: { requestId: id, notes: message } });
      if (!result.ok) throw new Error("We couldn't send that message");
    },
    onSuccess: () => {
      toast.success("Message sent to our studio");
      setMessage("");
      void briefQuery.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (briefQuery.isLoading) {
    return (
      <main className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading your brief…
      </main>
    );
  }

  const result = briefQuery.data;
  if (!result || !result.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="display-type text-3xl">Brief not available</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {result?.error ?? "We couldn't find that brief on your account."}
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-full">
          <Link to="/portal">Back to your portal</Link>
        </Button>
      </main>
    );
  }

  const brief = result.brief;
  const step = briefStages.indexOf(brief.status as (typeof briefStages)[number]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <Link
        to="/portal"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to your portal
      </Link>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Design brief</p>
          <h1 className="display-type mt-2 text-3xl">
            {brief.product_interest || "Your brief"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sent {formatDate(brief.created_at)} · {brief.email}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            brief.status === "lost"
              ? "border-border text-muted-foreground"
              : "border-transparent bg-foreground text-background"
          }`}
        >
          {statusLabels[brief.status] ?? brief.status}
        </span>
      </header>

      {brief.status !== "lost" && (
        <ol className="mt-6 flex flex-wrap gap-2">
          {briefStages.map((stage, i) => (
            <li
              key={stage}
              className={`rounded-full border px-3 py-1 text-xs ${
                step >= 0 && i <= step
                  ? "border-transparent bg-accent text-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {stageLabels[stage]}
            </li>
          ))}
        </ol>
      )}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="What you're after" value={brief.product_interest || "Not specified"} />
        <Detail label="Quantity" value={brief.quantity ? `${brief.quantity} units` : "To confirm"} />
        <Detail label="Decoration / finish" value={brief.decoration || "To confirm"} />
        <Detail
          label="Needed by"
          value={brief.required_by ? formatDate(brief.required_by) : "Flexible"}
        />
        <Detail label="Budget" value={brief.budget || "Not given"} />
        <Detail label="Company" value={brief.company || brief.name} />
      </section>

      {brief.notes && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Your notes</h2>
          <p className="mt-3 whitespace-pre-line rounded-xl bg-accent/40 p-4 text-sm text-muted-foreground">
            {brief.notes}
          </p>
        </section>
      )}

      {(brief.quote || brief.job) && (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Where it's up to</h2>
          {brief.quote && (
            <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
              <div>
                <p className="font-semibold">Quote {brief.quote.number}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(brief.quote.total_cents, brief.quote.currency)} ·{" "}
                  {statusLabels[brief.quote.status] ?? brief.quote.status}
                </p>
              </div>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/q/$token" params={{ token: brief.quote.token }}>
                  Open quote <ExternalLink className="size-4" />
                </Link>
              </Button>
            </article>
          )}
          {brief.job && (
            <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
              <div>
                <p className="font-semibold">
                  Order {brief.job.number} · {brief.job.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusLabels[brief.job.stage] ?? brief.job.stage}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/job/$token" params={{ token: brief.job.token }}>
                  Track order <ExternalLink className="size-4" />
                </Link>
              </Button>
            </article>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Files on this brief</h2>
        {brief.files.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing attached yet — add your logo or artwork below.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {brief.files.map((file) => (
              <li key={file.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    {file.file_name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {file.source === "brief" ? "Sent with the brief" : "Added later"} ·{" "}
                    {formatDate(file.created_at)}
                    {file.notes ? ` · ${file.notes}` : ""}
                  </p>
                </div>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="brief-file">Add a file (max 25MB)</Label>
            <Input id="brief-file" type="file" ref={fileRef} />
          </div>
          <Textarea
            rows={2}
            maxLength={1000}
            placeholder="Anything we should know about this file (optional)"
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
            Upload file
          </Button>
        </div>
      </section>

      <section className="mt-12 mb-8">
        <h2 className="text-xl font-semibold">Messages</h2>
        {brief.messages.length > 0 && (
          <ul className="mt-4 space-y-3">
            {brief.messages.map((note) => (
              <li key={note.id} className="rounded-xl border border-border bg-card p-4">
                <p className="whitespace-pre-line text-sm">{note.notes}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(note.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-5">
          <Textarea
            rows={3}
            maxLength={1000}
            placeholder="Add a note for our studio — changes, questions, extra detail"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            variant="outline"
            className="rounded-full"
            disabled={messageMutation.isPending || message.trim().length < 2}
            onClick={() => messageMutation.mutate()}
          >
            {messageMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageSquare className="size-4" />
            )}
            Send message
          </Button>
        </div>
      </section>
    </main>
  );
}
