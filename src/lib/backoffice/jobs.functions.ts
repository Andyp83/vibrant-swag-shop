import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/backoffice/guard";
import { jobEventSchema, jobSchema, proofSchema, uuid } from "@/lib/backoffice/schemas";
import type { Job, JobEvent, JobStage, Proof } from "@/lib/backoffice/types";

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Job[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("jobs")
      .select("*, customer:customers(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Job[];
  });

export const getJobDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(
    async ({ data, context }): Promise<{ job: Job; events: JobEvent[]; proofs: Proof[] }> => {
      await assertAdmin(context);
      const db = context.supabase;
      const [job, events, proofs] = await Promise.all([
        db.from("jobs").select("*, customer:customers(*)").eq("id", data.id).single(),
        db
          .from("job_events")
          .select("*")
          .eq("job_id", data.id)
          .order("created_at", { ascending: false }),
        db.from("proofs").select("*").eq("job_id", data.id).order("version", { ascending: false }),
      ]);
      if (job.error || !job.data) throw new Error(job.error?.message ?? "Job not found");

      const proofRows = (proofs.data ?? []) as unknown as Proof[];
      const withUrls = await Promise.all(
        proofRows.map(async (proof) => {
          const { data: signed } = await db.storage
            .from("proofs")
            .createSignedUrl(proof.file_path, 3600);
          return { ...proof, signed_url: signed?.signedUrl ?? null };
        }),
      );

      return {
        job: job.data as unknown as Job,
        events: (events.data ?? []) as unknown as JobEvent[],
        proofs: withUrls,
      };
    },
  );

export const saveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => jobSchema.parse(input))
  .handler(async ({ data, context }): Promise<Job> => {
    await assertAdmin(context);
    const payload = {
      customer_id: data.customer_id,
      quote_id: data.quote_id,
      title: data.title,
      stage: data.stage,
      due_date: data.due_date || null,
      tracking_number: data.tracking_number,
      supplier_reference: data.supplier_reference,
      notes: data.notes,
    };
    const { data: job, error } = await (data.id
      ? context.supabase.from("jobs").update(payload).eq("id", data.id).select("*").single()
      : context.supabase.from("jobs").insert(payload).select("*").single());
    if (error || !job) throw new Error(error?.message ?? "Could not save job");
    if (!data.id) {
      await context.supabase
        .from("job_events")
        .insert({ job_id: job.id, kind: "created", message: "Job created" });
    }
    return job as unknown as Job;
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ id: uuid.parse((input as { id: string }).id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Moves a job to a new stage, logs it, and optionally emails the customer. */
export const setJobStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = input as { id: string; stage: JobStage; notify?: boolean };
    return {
      id: uuid.parse(raw.id),
      stage: jobSchema.shape.stage.parse(raw.stage),
      notify: Boolean(raw.notify),
    };
  })
  .handler(async ({ data, context }): Promise<{ sent: boolean; error?: string }> => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: job, error } = await db
      .from("jobs")
      .update({ stage: data.stage })
      .eq("id", data.id)
      .select("*, customer:customers(*)")
      .single();
    if (error || !job) throw new Error(error?.message ?? "Job not found");

    const record = job as unknown as Job;
    await db.from("job_events").insert({
      job_id: record.id,
      kind: "stage",
      message: `Stage moved to ${data.stage}`,
    });

    if (!data.notify || !record.customer) return { sent: false };

    const { sendEmail, emailShell, siteOrigin } = await import("@/lib/backoffice/email.server");
    return sendEmail({
      to: record.customer.email,
      subject: `Job ${record.number} update: ${data.stage}`,
      template: "job_update",
      relatedType: "job",
      relatedId: record.id,
      html: emailShell(
        `${record.title}`,
        `<p>Hi ${record.customer.name},</p><p>Your job <strong>${record.number}</strong> has moved to <strong>${data.stage}</strong>.${record.tracking_number ? ` Tracking: ${record.tracking_number}.` : ""}</p>`,
        { label: "Track this job", url: `${siteOrigin()}/job/${record.share_token}` },
      ),
    });
  });

export const addJobEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => jobEventSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("job_events").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Signs a short-lived upload URL for a proof file in the private proofs bucket. */
export const createProofUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = input as { jobId: string; fileName: string };
    return {
      jobId: uuid.parse(raw.jobId),
      fileName: String(raw.fileName).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120),
    };
  })
  .handler(async ({ data, context }): Promise<{ path: string; token: string }> => {
    await assertAdmin(context);
    const path = `${data.jobId}/${Date.now()}-${data.fileName}`;
    const { data: signed, error } = await context.supabase.storage
      .from("proofs")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Could not prepare upload");
    return { path: signed.path, token: signed.token };
  });

/** Records an uploaded proof, versions it, and emails the customer for approval. */
export const sendProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => proofSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ sent: boolean; error?: string }> => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: job, error: jobError } = await db
      .from("jobs")
      .select("*, customer:customers(*)")
      .eq("id", data.job_id)
      .single();
    if (jobError || !job) throw new Error(jobError?.message ?? "Job not found");

    const { data: existing } = await db
      .from("proofs")
      .select("version")
      .eq("job_id", data.job_id)
      .order("version", { ascending: false })
      .limit(1);
    const version = ((existing?.[0]?.version as number | undefined) ?? 0) + 1;

    const { data: proof, error } = await db
      .from("proofs")
      .insert({
        job_id: data.job_id,
        version,
        file_path: data.file_path,
        notes: data.notes,
        sent_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error || !proof) throw new Error(error?.message ?? "Could not save proof");

    await db.from("jobs").update({ stage: "proof" }).eq("id", data.job_id);
    await db
      .from("job_events")
      .insert({ job_id: data.job_id, kind: "proof", message: `Proof v${version} sent` });

    const record = job as unknown as Job;
    if (!record.customer) return { sent: false };

    const { sendEmail, emailShell, siteOrigin } = await import("@/lib/backoffice/email.server");
    return sendEmail({
      to: record.customer.email,
      subject: `Proof v${version} for ${record.number} — please approve`,
      template: "proof_sent",
      relatedType: "proof",
      relatedId: proof.id as string,
      html: emailShell(
        `Proof v${version} — ${record.title}`,
        `<p>Hi ${record.customer.name},</p><p>Your artwork proof is ready. Please approve it or request changes so we can get into production.</p>${data.notes ? `<p><em>${data.notes}</em></p>` : ""}`,
        {
          label: "View proof",
          url: `${siteOrigin()}/proof/${(proof as { share_token: string }).share_token}`,
        },
      ),
    });
  });
