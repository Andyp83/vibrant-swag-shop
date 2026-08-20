import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { formatDate } from "@/lib/backoffice/format";
import { getSharedJob } from "@/lib/backoffice/public.functions";
import { jobStages, statusLabels } from "@/lib/backoffice/types";

export const Route = createFileRoute("/job/$token")({
  head: () => ({
    meta: [
      { title: "Track your job | See See Bloom" },
      {
        name: "description",
        content: "Follow your branded merchandise order from artwork through to delivery.",
      },
      { property: "og:title", content: "Track your job | See See Bloom" },
      { property: "og:description", content: "Live production tracking for your order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedJobPage,
});

function SharedJobPage() {
  const { token } = Route.useParams();
  const fetchJob = useServerFn(getSharedJob);
  const jobQuery = useQuery({
    queryKey: ["shared-job", token],
    queryFn: () => fetchJob({ data: { token } }),
  });

  if (jobQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const job = jobQuery.data;
  if (!job) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">This tracking link isn't valid</h1>
        <p className="mt-4 text-muted-foreground">Reply to your email and we'll resend it.</p>
      </main>
    );
  }

  const currentIndex = jobStages.indexOf(job.stage as (typeof jobStages)[number]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">See See Bloom</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{job.title}</h1>
      <p className="mt-2 text-muted-foreground">
        Job {job.number} for {job.customer_name}
        {job.due_date ? ` · due ${formatDate(job.due_date)}` : ""}
      </p>

      <ol className="mt-10 grid gap-3 sm:grid-cols-3">
        {jobStages.map((stage, index) => (
          <li
            key={stage}
            className={`rounded-xl border p-4 text-sm ${
              index <= currentIndex ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
          >
            <span className="block text-xs uppercase tracking-widest opacity-70">
              Step {index + 1}
            </span>
            {statusLabels[stage] ?? stage}
          </li>
        ))}
      </ol>

      {job.tracking_number ? (
        <p className="mt-8 text-sm">
          Tracking number: <strong>{job.tracking_number}</strong>
        </p>
      ) : null}

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Timeline
        </h2>
        <ul className="mt-4 space-y-3">
          {job.timeline.map((event, index) => (
            <li key={index} className="border-l-2 pl-4 text-sm">
              <p>{event.message}</p>
              <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
            </li>
          ))}
          {job.timeline.length === 0 ? (
            <li className="text-sm text-muted-foreground">No updates yet.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
