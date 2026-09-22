import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BriefFile = {
  key: string;
  file_name: string;
  url: string | null;
  notes: string;
  created_at: string;
  source: "brief" | "added";
};

export type BriefMessage = {
  id: string;
  notes: string;
  created_at: string;
};

export type BriefDetail = {
  id: string;
  created_at: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  product_interest: string | null;
  decoration: string | null;
  quantity: number | null;
  required_by: string | null;
  budget: string | null;
  notes: string | null;
  status: string;
  files: BriefFile[];
  messages: BriefMessage[];
  quote: { number: string; token: string; status: string; total_cents: number; currency: string } | null;
  job: { number: string; title: string; stage: string; token: string } | null;
};

const BUCKET = "quote-uploads";

function fileNameFromPath(path: string): string {
  return path.split("/").pop() || path;
}

async function signedUrl(path: string): Promise<string | null> {
  const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

/**
 * Loads one brief, but only when it belongs to the signed-in person's email address.
 * Returns null for anything they don't own so the page can 404 cleanly.
 */
export async function loadBriefForEmail(email: string, id: string): Promise<BriefDetail | null> {
  if (!email) return null;

  const { data: brief } = await supabaseAdmin
    .rpc("quote_requests_by_email", { p_email: email })
    .select(
      "id, created_at, name, company, email, phone, product_interest, decoration, quantity, required_by, budget, notes, status, file_paths",
    )
    .eq("id", id)
    .maybeSingle();
  if (!brief) return null;

  const [{ data: activity }, { data: quotes }] = await Promise.all([
    supabaseAdmin
      .from("quote_request_activity")
      .select("id, kind, file_path, file_name, notes, created_at")
      .eq("request_id", brief.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("quotes")
      .select("id, number, share_token, status, total_cents, currency")
      .eq("request_id", brief.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const rows = (activity ?? []) as {
    id: string;
    kind: string;
    file_path: string | null;
    file_name: string | null;
    notes: string | null;
    created_at: string;
  }[];

  const originalPaths = ((brief.file_paths ?? []) as string[]).filter(Boolean);
  const originals: BriefFile[] = await Promise.all(
    originalPaths.map(async (path) => ({
      key: path,
      file_name: fileNameFromPath(path),
      url: await signedUrl(path),
      notes: "",
      created_at: brief.created_at as string,
      source: "brief" as const,
    })),
  );

  const added: BriefFile[] = await Promise.all(
    rows
      .filter((row) => row.kind === "upload" && row.file_path)
      .map(async (row) => ({
        key: row.id,
        file_name: row.file_name || fileNameFromPath(row.file_path!),
        url: await signedUrl(row.file_path!),
        notes: row.notes ?? "",
        created_at: row.created_at,
        source: "added" as const,
      })),
  );

  const messages: BriefMessage[] = rows
    .filter((row) => row.kind === "message")
    .map((row) => ({ id: row.id, notes: row.notes ?? "", created_at: row.created_at }));

  const quoteRow = (quotes ?? [])[0] as
    | { id: string; number: string; share_token: string; status: string; total_cents: number; currency: string }
    | undefined;

  let job: BriefDetail["job"] = null;
  if (quoteRow) {
    const { data: jobRow } = await supabaseAdmin
      .from("jobs")
      .select("number, title, stage, share_token")
      .eq("quote_id", quoteRow.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (jobRow) {
      job = {
        number: jobRow.number as string,
        title: jobRow.title as string,
        stage: jobRow.stage as string,
        token: jobRow.share_token as string,
      };
    }
  }

  const { file_paths: _ignored, ...rest } = brief as typeof brief & { file_paths: string[] | null };

  return {
    ...(rest as Omit<BriefDetail, "files" | "messages" | "quote" | "job">),
    files: [...added, ...originals],
    messages,
    quote: quoteRow
      ? {
          number: quoteRow.number,
          token: quoteRow.share_token,
          status: quoteRow.status,
          total_cents: quoteRow.total_cents,
          currency: quoteRow.currency,
        }
      : null,
    job,
  };
}

/** Confirms ownership without loading the whole brief. */
async function ownsBrief(email: string, id: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabaseAdmin
    .rpc("quote_requests_by_email", { p_email: email })
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return Boolean(data);
}

/** Issues a short-lived signed upload ticket for a file attached to a brief. */
export async function createBriefUploadTicket(email: string, id: string, fileName: string) {
  if (!(await ownsBrief(email, id))) return { error: "Brief not found" as const };
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  const path = `brief/${id}/${Date.now()}-${safeName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "Upload could not be started" as const };
  return { path: data.path, token: data.token };
}

/** Records an uploaded file (or a note) against a brief. */
export async function saveBriefActivity(
  email: string,
  userId: string,
  input: {
    requestId: string;
    kind: "upload" | "message";
    path?: string | null;
    fileName?: string | null;
    notes: string;
  },
): Promise<boolean> {
  if (!(await ownsBrief(email, input.requestId))) return false;
  const { error } = await supabaseAdmin.from("quote_request_activity").insert({
    request_id: input.requestId,
    kind: input.kind,
    file_path: input.path ?? null,
    file_name: input.fileName ?? null,
    notes: input.notes,
    created_by: userId,
  });
  if (error) throw new Error(error.message);
  return true;
}
