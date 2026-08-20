import { z } from "zod";

export const uuid = z.string().uuid();

export const customerSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().max(160).nullable().default(null),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(60).nullable().default(null),
  notes: z.string().trim().max(4000).default(""),
});

export const requestStatusSchema = z.object({
  id: uuid,
  status: z.enum(["new", "in_progress", "quoted", "won", "lost"]),
  admin_notes: z.string().trim().max(4000).default(""),
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Describe the line").max(300),
  product: z.string().trim().max(160).default(""),
  decoration: z.string().trim().max(160).default(""),
  quantity: z.number().int().min(1).max(1_000_000),
  unit_price_cents: z.number().int().min(0).max(100_000_000),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export const quoteSchema = z.object({
  id: uuid.optional(),
  customer_id: uuid,
  request_id: uuid.nullable().default(null),
  currency: z.string().trim().length(3).default("AUD"),
  discount_cents: z.number().int().min(0).max(100_000_000).default(0),
  freight_cents: z.number().int().min(0).max(100_000_000).default(0),
  setup_cents: z.number().int().min(0).max(100_000_000).default(0),
  tax_rate: z.number().min(0).max(99).default(10),
  valid_until: z.string().trim().max(10).nullable().default(null),
  terms: z.string().trim().max(4000).default(""),
  notes: z.string().trim().max(4000).default(""),
  line_items: z.array(lineItemSchema).min(1, "Add at least one line").max(40),
});

export const jobSchema = z.object({
  id: uuid.optional(),
  customer_id: uuid,
  quote_id: uuid.nullable().default(null),
  title: z.string().trim().min(1, "Title is required").max(200),
  stage: z
    .enum(["artwork", "proof", "approved", "production", "shipped", "delivered"])
    .default("artwork"),
  due_date: z.string().trim().max(10).nullable().default(null),
  tracking_number: z.string().trim().max(120).default(""),
  supplier_reference: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(4000).default(""),
});

export const jobEventSchema = z.object({
  job_id: uuid,
  kind: z.string().trim().max(40).default("note"),
  message: z.string().trim().min(1).max(1000),
});

export const proofSchema = z.object({
  job_id: uuid,
  file_path: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).default(""),
});

export const invoiceSchema = z.object({
  id: uuid.optional(),
  customer_id: uuid,
  quote_id: uuid.nullable().default(null),
  job_id: uuid.nullable().default(null),
  kind: z.enum(["deposit", "final", "full"]).default("full"),
  description: z.string().trim().max(300).default(""),
  amount_cents: z.number().int().min(100).max(100_000_000),
  currency: z.string().trim().length(3).default("AUD"),
  due_date: z.string().trim().max(10).nullable().default(null),
});

export const tokenSchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{16,64}$/, "Invalid link"),
});

export const quoteResponseSchema = tokenSchema.extend({
  decision: z.enum(["accept", "decline"]),
});

export const proofResponseSchema = tokenSchema.extend({
  decision: z.enum(["approve", "changes"]),
  note: z.string().trim().max(1000).default(""),
});
