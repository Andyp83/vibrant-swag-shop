import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const confirmQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { sendQuoteRequestConfirmation } = await import("@/lib/backoffice/quote-confirm.server");
    return sendQuoteRequestConfirmation(data.requestId);
  });
