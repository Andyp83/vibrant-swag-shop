import { supabase } from "@/integrations/supabase/client";
import { createArtworkUploadUrls } from "@/lib/artwork-upload.functions";

/** Uploads files via server-issued signed URLs; returns stored paths in order. */
export async function uploadArtwork(
  kind: "shortlist" | "quote" | "sourcing" | "design",
  files: File[],
): Promise<string[]> {
  if (files.length === 0) return [];
  const { uploads } = await createArtworkUploadUrls({
    data: { kind, files: files.map((file) => ({ name: file.name })) },
  });
  const paths: string[] = [];
  for (const [index, file] of files.entries()) {
    const target = uploads[index]!;
    const { error } = await supabase.storage
      .from("quote-uploads")
      .uploadToSignedUrl(target.path, target.token, file, { cacheControl: "3600" });
    if (error) throw error;
    paths.push(target.path);
  }
  return paths;
}
