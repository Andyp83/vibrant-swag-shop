import { z } from "zod";

const uuid = z.string().uuid();

export const portalQuoteDecisionSchema = z.object({
  quoteId: uuid,
  decision: z.enum(["accept", "decline"]),
});

export const portalProofSignSchema = z.object({
  proofId: uuid,
  decision: z.enum(["approve", "changes"]),
  signedName: z.string().trim().max(120).default(""),
  note: z.string().trim().max(1000).default(""),
});

export const portalUploadTicketSchema = z.object({
  fileName: z.string().trim().min(1, "File name required").max(200),
});

export const portalUploadRecordSchema = z.object({
  path: z.string().trim().min(1).max(400),
  fileName: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(1000).default(""),
  jobId: uuid.nullable().default(null),
});
