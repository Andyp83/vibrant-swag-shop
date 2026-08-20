import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Send, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/backoffice/format";
import {
  addJobEvent,
  createProofUploadUrl,
  getJobDetail,
  listJobs,
  saveJob,
  sendProof,
  setJobStage,
} from "@/lib/backoffice/jobs.functions";
import { jobStages, statusLabels } from "@/lib/backoffice/types";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs & proofs | See See Bloom back office" },
      {
        name: "description",
        content: "Track production stages, upload artwork proofs and share live job status links.",
      },
      { property: "og:title", content: "Jobs & proofs | See See Bloom back office" },
      { property: "og:description", content: "Track production and send artwork proofs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listJobs);
  const detailFn = useServerFn(getJobDetail);
  const stageFn = useServerFn(setJobStage);
  const saveFn = useServerFn(saveJob);
  const eventFn = useServerFn(addJobEvent);
  const uploadUrlFn = useServerFn(createProofUploadUrl);
  const sendProofFn = useServerFn(sendProof);

  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const jobs = useQuery({ queryKey: ["admin-jobs"], queryFn: () => listFn({}) });
  const detail = useQuery({
    queryKey: ["admin-job", selected],
    queryFn: () => detailFn({ data: { id: selected as string } }),
    enabled: Boolean(selected),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-job", selected] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const stage = useMutation({
    mutationFn: (input: { id: string; stage: string }) =>
      stageFn({ data: { id: input.id, stage: input.stage as "artwork", notify: true } }),
    onSuccess: () => {
      toast.success("Stage updated and customer notified");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateJob = useMutation({
    mutationFn: (input: { id: string; due_date: string | null; tracking_number: string }) =>
      saveFn({
        data: {
          id: input.id,
          title: detail.data?.job.title ?? "",
          customer_id: detail.data?.job.customer_id ?? "",
          quote_id: detail.data?.job.quote_id ?? null,
          stage: (detail.data?.job.stage ?? "artwork") as "artwork",
          due_date: input.due_date,
          tracking_number: input.tracking_number,
          supplier_reference: detail.data?.job.supplier_reference ?? "",
          notes: detail.data?.job.notes ?? "",
        },
      }),
    onSuccess: () => {
      toast.success("Job updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addNote = useMutation({
    mutationFn: (input: { id: string; message: string }) =>
      eventFn({ data: { job_id: input.id, kind: "note", message: input.message } }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadProof = useMutation({
    mutationFn: async (input: { id: string; file: File; notes: string }) => {
      const target = await uploadUrlFn({
        data: { job_id: input.id, filename: input.file.name, notes: input.notes },
      });
      const { supabase } = await import("@/integrations/supabase/client");
      const upload = await supabase.storage
        .from("proofs")
        .uploadToSignedUrl(target.path, target.token, input.file);
      if (upload.error) throw new Error(upload.error.message);
      return target;
    },
    onSuccess: () => {
      toast.success("Proof uploaded");
      setProofNotes("");
      if (fileInput.current) fileInput.current.value = "";
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const emailProof = useMutation({
    mutationFn: (id: string) => sendProofFn({ data: { id } }),
    onSuccess: (result) => {
      if (result.sent) toast.success("Proof sent for approval");
      else toast.warning(result.error ?? "Proof marked as sent, but the email didn't go out");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const job = detail.data?.job;

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <section>
        <h2 className="text-lg font-semibold">Job list</h2>
        {jobs.isLoading ? (
          <Loader2 className="mt-4 size-5 animate-spin" />
        ) : (
          <ul className="mt-4 space-y-2">
            {(jobs.data ?? []).map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${
                    selected === row.id ? "border-foreground" : ""
                  }`}
                >
                  <p className="text-sm font-medium">
                    {row.number} · {row.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.customer?.company || row.customer?.name} ·{" "}
                    {statusLabels[row.stage] ?? row.stage} · due {formatDate(row.due_date)}
                  </p>
                </button>
              </li>
            ))}
            {(jobs.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No jobs yet — open one from an accepted quote.
              </p>
            ) : null}
          </ul>
        )}
      </section>

      <section>
        {!job ? (
          <p className="text-sm text-muted-foreground">Select a job to manage it.</p>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {job.number} · {job.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {job.customer?.company || job.customer?.name} · {job.customer?.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={job.stage}
                  onValueChange={(value) => stage.mutate({ id: job.id, stage: value })}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobStages.map((value) => (
                      <SelectItem key={value} value={value}>
                        {statusLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `${window.location.origin}/job/${job.share_token}`,
                    );
                    toast.success("Tracking link copied");
                  }}
                >
                  <Copy className="size-4" />
                  Tracking link
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  defaultValue={job.due_date ?? ""}
                  onBlur={(event) =>
                    updateJob.mutate({
                      id: job.id,
                      due_date: event.target.value || null,
                      tracking_number: job.tracking_number,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tracking number</Label>
                <Input
                  defaultValue={job.tracking_number}
                  onBlur={(event) =>
                    updateJob.mutate({
                      id: job.id,
                      due_date: job.due_date,
                      tracking_number: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h3 className="font-semibold">Artwork proofs</h3>
              <div className="mt-4 space-y-3">
                {(detail.data?.proofs ?? []).map((proof) => (
                  <div
                    key={proof.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">Version {proof.version}</p>
                      <p className="text-muted-foreground">
                        {statusLabels[proof.status] ?? proof.status} ·{" "}
                        {formatDate(proof.sent_at ?? proof.created_at)}
                      </p>
                      {proof.response_note ? (
                        <p className="mt-1">“{proof.response_note}”</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {proof.signed_url ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={proof.signed_url} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        onClick={() => emailProof.mutate(proof.id)}
                        disabled={emailProof.isPending}
                      >
                        <Send className="size-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                ))}
                {(detail.data?.proofs ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No proofs uploaded yet.</p>
                ) : null}
              </div>

              <div className="mt-5 space-y-3 border-t pt-5">
                <Input ref={fileInput} type="file" accept="image/*,application/pdf" />
                <Textarea
                  rows={2}
                  placeholder="Notes for the customer about this proof"
                  value={proofNotes}
                  onChange={(event) => setProofNotes(event.target.value)}
                />
                <Button
                  onClick={() => {
                    const file = fileInput.current?.files?.[0];
                    if (!file) {
                      toast.error("Choose a proof file first");
                      return;
                    }
                    uploadProof.mutate({ id: job.id, file, notes: proofNotes });
                  }}
                  disabled={uploadProof.isPending}
                >
                  {uploadProof.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Upload proof
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h3 className="font-semibold">Timeline</h3>
              <ol className="mt-4 space-y-3 text-sm">
                {(detail.data?.events ?? []).map((event) => (
                  <li key={event.id} className="border-l-2 pl-4">
                    <p>{event.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Add an internal note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => note.trim() && addNote.mutate({ id: job.id, message: note.trim() })}
                  disabled={addNote.isPending}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
