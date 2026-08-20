import { getRequestUrl } from "@tanstack/react-start/server";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  template: string;
  relatedType?: string;
  relatedId?: string;
  attachment?: { filename: string; contentBase64: string };
};

export function siteOrigin(): string {
  try {
    return new URL(getRequestUrl()).origin;
  } catch {
    return "";
  }
}

const BRAND = "See See Bloom";

export function emailShell(heading: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f5f2;font-family:Helvetica,Arial,sans-serif;color:#1c1b1a">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="height:6px;background:linear-gradient(90deg,#e3342f,#f6993f,#ffed4a,#38c172,#4dc0b5,#3490dc,#6574cd,#9561e2,#f66d9b)"></div>
    <div style="background:#ffffff;padding:32px;border:1px solid #e6e3dd;border-top:none">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7a746c">${BRAND}</p>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${heading}</h1>
      <div style="font-size:15px;line-height:1.6">${body}</div>
      ${
        cta
          ? `<p style="margin:28px 0 0"><a href="${cta.url}" style="display:inline-block;background:#1c1b1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">${cta.label}</a></p>`
          : ""
      }
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#8a847c">${BRAND} — branded merchandise for brands worth remembering.</p>
  </div>
</body></html>`;
}

/**
 * Sends a transactional email through Resend when a sending domain is configured,
 * and always records the attempt in email_log so the admin can see what went out.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"] ?? "See See Bloom <onboarding@resend.dev>";

  const log = async (status: string, error?: string) => {
    await supabaseAdmin.from("email_log").insert({
      to_email: input.to,
      subject: input.subject,
      template: input.template,
      related_type: input.relatedType ?? null,
      related_id: input.relatedId ?? null,
      status,
      error: error ?? null,
    });
  };

  if (!apiKey) {
    await log("not_configured", "No sending domain connected yet");
    return { sent: false, error: "Email sending is not connected yet — set up your email domain." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.attachment
          ? {
              attachments: [
                { filename: input.attachment.filename, content: input.attachment.contentBase64 },
              ],
            }
          : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      await log("failed", detail.slice(0, 500));
      return { sent: false, error: `Email provider rejected the send (${response.status})` };
    }

    await log("sent");
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    await log("failed", message);
    return { sent: false, error: message };
  }
}
