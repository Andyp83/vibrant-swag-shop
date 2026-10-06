import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Issues one-time signed upload URLs for customer artwork. Visitors can no
 * longer write to the private artwork bucket directly; every file lands in a
 * fresh server-chosen folder so submissions can only reference their own files.
 */
const KINDS = ["shortlist", "quote", "sourcing", "design"] as const;

const inputSchema = z.object({
  kind: z.enum(KINDS),
  files: z.array(z.object({ name: z.string().trim().min(1).max(255) })).min(1).max(20),
});

const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|svg|pdf|ai|eps|psd|tiff?|zip)$/i;

export const SAFE_UPLOAD_PATH = /^(shortlist|quote|sourcing|design)\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/;

export const createArtworkUploadUrls = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const folder = `${data.kind}/${crypto.randomUUID()}`;
    const uploads: { path: string; token: string }[] = [];
    for (const [index, file] of data.files.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      if (!ALLOWED_EXT.test(safeName)) throw new Error(`Unsupported file type: ${file.name}`);
      const path = `${folder}/${index + 1}-${safeName}`;
      const { data: signed, error } = await supabaseAdmin.storage
        .from("quote-uploads")
        .createSignedUploadUrl(path);
      if (error || !signed) throw new Error("Could not prepare upload");
      uploads.push({ path: signed.path, token: signed.token });
    }
    return { uploads };
  });
