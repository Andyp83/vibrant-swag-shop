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

/** Records a customer's accept/decline decision on one of their own quotes. */
export async function recordQuoteDecision(
  customerId: string,
  quoteId: string,
  decision: "accept" | "decline",
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("quotes")
    .update(
      decision === "accept"
        ? { status: "accepted", accepted_at: now }
        : { status: "declined", declined_at: now },
    )
    .eq("id", quoteId)
    .eq("customer_id", customerId)
    .in("status", ["sent", "accepted", "declined"])
    .select("id, request_id")
    .maybeSingle();
  if (!data) return false;
  if (data.request_id) {
    await supabaseAdmin
      .from("quote_requests")
      .update({ status: decision === "accept" ? "won" : "lost" })
      .eq("id", data.request_id);
  }
  const { notifyQuoteDecision } = await import("@/lib/backoffice/notify.server");
  await notifyQuoteDecision(data.id as string, decision);
  return true;
}

/** Stores a typed-signature approval (or change request) against a proof. */
export async function recordProofSignature(
  customerId: string,
  input: { proofId: string; decision: "approve" | "changes"; signedName: string; note: string },
): Promise<boolean> {
  const { data: proof } = await supabaseAdmin
    .from("proofs")
    .select("id, job_id, version, jobs!inner(customer_id)")
    .eq("id", input.proofId)
    .eq("jobs.customer_id", customerId)
    .maybeSingle();
  if (!proof) return false;

  const approved = input.decision === "approve";
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("proofs")
    .update({
      status: approved ? "approved" : "changes_requested",
      responded_at: now,
      response_note: input.note,
      ...(approved ? { signed_name: input.signedName, signed_at: now } : {}),
    })
    .eq("id", proof.id);

  await supabaseAdmin
    .from("jobs")
    .update({ stage: approved ? "approved" : "artwork" })
    .eq("id", proof.job_id);

  await supabaseAdmin.from("job_events").insert({
    job_id: proof.job_id,
    kind: "proof",
    message: approved
      ? `${input.signedName} signed off proof v${proof.version} in the client portal on ${now}`
      : `Customer requested changes on proof v${proof.version} via the client portal${
          input.note ? `: ${input.note}` : ""
        }`,
  });

  const { notifyProofResponse } = await import("@/lib/backoffice/notify.server");
  await notifyProofResponse(proof.id as string, input.decision, {
    signedName: approved ? input.signedName : undefined,
    note: input.note,
  });
  return true;
}

/** Issues a short-lived signed upload ticket for a customer artwork file. */
export async function createUploadTicket(customerId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  const path = `portal/${customerId}/${Date.now()}-${safeName}`;
  const { data, error } = await supabaseAdmin.storage
    .from("quote-uploads")
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error("Upload could not be started");
  return { path: data.path, token: data.token };
}

/** Saves the upload record and notes it on the related job timeline. */
export async function saveUpload(
  customerId: string,
  input: { path: string; fileName: string; notes: string; jobId: string | null },
): Promise<boolean> {
  if (input.jobId && !(await assertOwnedJob(customerId, input.jobId))) return false;
  const { error } = await supabaseAdmin.from("customer_uploads").insert({
    customer_id: customerId,
    job_id: input.jobId,
    file_path: input.path,
    file_name: input.fileName,
    notes: input.notes,
  });
  if (error) throw new Error(error.message);
  if (input.jobId) {
    await supabaseAdmin.from("job_events").insert({
      job_id: input.jobId,
      kind: "artwork",
      message: `Customer uploaded artwork "${input.fileName}" via the client portal${
        input.notes ? `: ${input.notes}` : ""
      }`,
    });
  }
  return true;
}

/** Builds a signed-proof certificate PDF for one of the customer's own proofs. */
export async function buildProofCertificate(
  customer: PortalCustomer,
  proofId: string,
): Promise<{ fileName: string; base64: string } | null> {
  const { data: proof } = await supabaseAdmin
    .from("proofs")
    .select(
      "id, version, status, notes, response_note, signed_name, signed_at, file_path, jobs!inner(number, title, customer_id)",
    )
    .eq("id", proofId)
    .eq("jobs.customer_id", customer.id)
    .maybeSingle();
  if (!proof) return null;

  const row = proof as unknown as {
    version: number;
    status: string;
    notes: string;
    response_note: string;
    signed_name: string;
    signed_at: string | null;
    file_path: string;
    jobs: { number: string; title: string };
  };

  let artwork: { bytes: Uint8Array; contentType: string } | null = null;
  const lower = row.file_path.toLowerCase();
  if (/\.(png|jpe?g)$/.test(lower)) {
    const { data: file } = await supabaseAdmin.storage.from("proofs").download(row.file_path);
    if (file) {
      artwork = {
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: lower.endsWith(".png") ? "image/png" : "image/jpeg",
      };
    }
  }

  const { renderProofCertificate } = await import("@/lib/backoffice/pdf.server");
  const base64 = await renderProofCertificate({
    jobNumber: row.jobs.number,
    jobTitle: row.jobs.title,
    version: row.version,
    status: row.status,
    notes: row.notes,
    responseNote: row.response_note,
    signedName: row.signed_name,
    signedAt: row.signed_at,
    customer,
    artwork,
  });
  return { fileName: `${row.jobs.number}-proof-v${row.version}.pdf`, base64 };
}

/** Builds an invoice PDF for one of the customer's own invoices. */
export async function buildInvoiceDocument(
  customer: PortalCustomer,
  invoiceId: string,
): Promise<{ fileName: string; base64: string } | null> {
  const { data } = await supabaseAdmin
    .from("invoices")
    .select("id, number, kind, description, amount_cents, currency, due_date, created_at, status")
    .eq("id", invoiceId)
    .eq("customer_id", customer.id)
    .neq("status", "draft")
    .maybeSingle();
  if (!data) return null;

  const invoice = data as unknown as {
    number: string;
    kind: string;
    description: string;
    amount_cents: number;
    currency: string;
    due_date: string | null;
    created_at: string;
  };

  const { renderQuoteDocument } = await import("@/lib/backoffice/pdf.server");
  const base64 = await renderQuoteDocument({
    kind: "Invoice",
    number: invoice.number,
    currency: invoice.currency,
    issuedOn: new Date(invoice.created_at).toLocaleDateString("en-AU"),
    dueLabel: "Due",
    dueOn: invoice.due_date,
    customer,
    lines: [
      {
        description: invoice.description || `${invoice.kind} payment`,
        quantity: 1,
        unit_price_cents: invoice.amount_cents,
        amount_cents: invoice.amount_cents,
      },
    ],
    total_cents: invoice.amount_cents,
    terms: "Payment can be made securely online from your client portal.",
  });
  return { fileName: `${invoice.number}.pdf`, base64 };
}


export type PortalEmailPreferences = {
  notifyProofSigned: boolean;
  notifyInvoiceAvailable: boolean;
};

/** Reads a customer's email notification opt-ins. */
export async function loadEmailPreferences(
  customerId: string,
): Promise<PortalEmailPreferences> {
  const { data } = await supabaseAdmin
    .from("customers")
    .select("notify_proof_signed, notify_invoice_available")
    .eq("id", customerId)
    .maybeSingle();
  return {
    notifyProofSigned: data?.notify_proof_signed ?? true,
    notifyInvoiceAvailable: data?.notify_invoice_available ?? true,
  };
}

/** Saves a customer's email notification opt-ins. */
export async function saveEmailPreferences(
  customerId: string,
  prefs: PortalEmailPreferences,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("customers")
    .update({
      notify_proof_signed: prefs.notifyProofSigned,
      notify_invoice_available: prefs.notifyInvoiceAvailable,
    })
    .eq("id", customerId);
  return !error;
}
