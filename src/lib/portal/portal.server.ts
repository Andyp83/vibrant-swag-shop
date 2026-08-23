import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PortalCustomer = {
  id: string;
  name: string;
  company: string | null;
  email: string;
};

export type PortalQuote = {
  id: string;
  number: string;
  status: string;
  currency: string;
  total_cents: number;
  valid_until: string | null;
  share_token: string;
  created_at: string;
};

export type PortalJob = {
  id: string;
  number: string;
  title: string;
  stage: string;
  due_date: string | null;
  tracking_number: string;
  created_at: string;
  timeline: { message: string; created_at: string }[];
};

export type PortalProof = {
  id: string;
  job_id: string;
  job_number: string;
  job_title: string;
  version: number;
  status: string;
  notes: string;
  response_note: string;
  signed_name: string;
  signed_at: string | null;
  created_at: string;
  image_url: string | null;
};

export type PortalInvoice = {
  id: string;
  number: string;
  status: string;
  kind: string;
  description: string;
  amount_cents: number;
  currency: string;
  due_date: string | null;
  share_token: string;
};

export type PortalUpload = {
  id: string;
  file_name: string;
  notes: string;
  job_id: string | null;
  created_at: string;
};

export type PortalData = {
  customer: PortalCustomer;
  quotes: PortalQuote[];
  jobs: PortalJob[];
  proofs: PortalProof[];
  invoices: PortalInvoice[];
  uploads: PortalUpload[];
};

/** Finds the customer record that matches a signed-in user's email address. */
export async function findCustomerByEmail(email: string): Promise<PortalCustomer | null> {
  const { data } = await supabaseAdmin
    .from("customers")
    .select("id, name, company, email")
    .ilike("email", email)
    .order("created_at", { ascending: true })
    .limit(1);
  return (data?.[0] as PortalCustomer | undefined) ?? null;
}

/** Confirms a record belongs to the customer, returning it or null. */
export async function assertOwnedJob(customerId: string, jobId: string) {
  const { data } = await supabaseAdmin
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("customer_id", customerId)
    .maybeSingle();
  return data;
}

export async function loadPortalData(customer: PortalCustomer): Promise<PortalData> {
  const [quotes, jobs, invoices, uploads] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select("id, number, status, currency, total_cents, valid_until, share_token, created_at")
      .eq("customer_id", customer.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("jobs")
      .select("id, number, title, stage, due_date, tracking_number, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("invoices")
      .select("id, number, status, kind, description, amount_cents, currency, due_date, share_token")
      .eq("customer_id", customer.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("customer_uploads")
      .select("id, file_name, notes, job_id, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const jobRows = (jobs.data ?? []) as Omit<PortalJob, "timeline">[];
  const jobIds = jobRows.map((job) => job.id);

  const [events, proofs] = await Promise.all([
    jobIds.length
      ? supabaseAdmin
          .from("job_events")
          .select("job_id, message, created_at")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as { job_id: string; message: string; created_at: string }[] }),
    jobIds.length
      ? supabaseAdmin
          .from("proofs")
          .select(
            "id, job_id, version, status, notes, response_note, signed_name, signed_at, created_at, file_path",
          )
          .in("job_id", jobIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const eventRows = (events.data ?? []) as { job_id: string; message: string; created_at: string }[];

  const proofRows = (proofs.data ?? []) as unknown as (Omit<
    PortalProof,
    "image_url" | "job_number" | "job_title"
  > & { file_path: string })[];

  const proofsWithUrls = await Promise.all(
    proofRows.map(async (proof) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("proofs")
        .createSignedUrl(proof.file_path, 3600);
      const job = jobRows.find((row) => row.id === proof.job_id);
      const { file_path: _path, ...rest } = proof;
      return {
        ...rest,
        job_number: job?.number ?? "",
        job_title: job?.title ?? "",
        image_url: signed?.signedUrl ?? null,
      } satisfies PortalProof;
    }),
  );

  return {
    customer,
    quotes: (quotes.data ?? []) as PortalQuote[],
    jobs: jobRows.map((job) => ({
      ...job,
      timeline: eventRows
        .filter((event) => event.job_id === job.id)
        .slice(0, 12)
        .map((event) => ({ message: event.message, created_at: event.created_at })),
    })),
    proofs: proofsWithUrls,
    invoices: (invoices.data ?? []) as PortalInvoice[],
    uploads: (uploads.data ?? []) as PortalUpload[],
  };
}
