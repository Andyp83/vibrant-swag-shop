import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSharedProof, respondToProof } from "@/lib/backoffice/public.functions";

export const Route = createFileRoute("/proof/$token")({
  head: () => ({
    meta: [
      { title: "Approve your proof | See See Bloom" },
      {
        name: "description",
        content: "Approve your artwork proof or request changes before production starts.",
      },
      { property: "og:title", content: "Approve your proof | See See Bloom" },
      { property: "og:description", content: "Approve artwork or request changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedProofPage,
});

function SharedProofPage() {
  const { token } = Route.useParams();
  const fetchProof = useServerFn(getSharedProof);
  const respond = useServerFn(respondToProof);
  const [note, setNote] = useState("");

  const proofQuery = useQuery({
    queryKey: ["shared-proof", token],
    queryFn: () => fetchProof({ data: { token } }),
  });

  const decide = useMutation({
    mutationFn: (decision: "approve" | "changes") =>
      respond({ data: { token, decision, note } }),
    onSuccess: (_result, decision) => {
      toast.success(
        decision === "approve" ? "Proof approved — into production it goes" : "Change request sent",
      );
      void proofQuery.refetch();
    },
    onError: () => toast.error("Sorry, we couldn't record that. Please reply to your email."),
  });

  if (proofQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const proof = proofQuery.data;
  if (!proof) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">This proof link isn't valid</h1>
        <p className="mt-4 text-muted-foreground">Reply to your email and we'll resend it.</p>
      </main>
    );
  }

  const responded = proof.status !== "sent";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">See See Bloom</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Proof v{proof.version} — {proof.job_title}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Job {proof.job_number} for {proof.customer_name}
      </p>

      {proof.image_url ? (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-muted/40 p-4">
          <img
            src={proof.image_url}
            alt={`Artwork proof version ${proof.version} for ${proof.job_title}`}
            className="mx-auto max-h-[70vh] w-auto"
          />
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">Proof file unavailable.</p>
      )}

      {proof.notes ? <p className="mt-6 whitespace-pre-line text-sm">{proof.notes}</p> : null}

      <div className="mt-10 border-t pt-8">
        {responded ? (
          <p className="text-sm font-medium">
            {proof.status === "approved"
              ? "You've approved this proof. Thank you!"
              : `Changes requested${proof.response_note ? `: ${proof.response_note}` : ""}`}
          </p>
        ) : (
          <>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 1000))}
              placeholder="Anything to change? Tell us here (optional for approval)."
              rows={4}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => decide.mutate("approve")} disabled={decide.isPending}>
                {decide.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Approve proof
              </Button>
              <Button
                variant="outline"
                onClick={() => decide.mutate("changes")}
                disabled={decide.isPending}
              >
                <MessageSquare className="size-4" />
                Request changes
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
