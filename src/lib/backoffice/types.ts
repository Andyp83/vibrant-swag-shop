export type QuoteRequestStatus = "new" | "in_progress" | "quoted" | "won" | "lost";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
export type JobStage = "artwork" | "proof" | "approved" | "production" | "shipped" | "delivered";
export type ProofStatus = "sent" | "approved" | "changes_requested";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export const quoteRequestStatuses: QuoteRequestStatus[] = [
  "new",
  "in_progress",
  "quoted",
  "won",
  "lost",
];
export const jobStages: JobStage[] = [
  "artwork",
  "proof",
  "approved",
  "production",
  "shipped",
  "delivered",
];
export const invoiceKinds = ["deposit", "final", "full"] as const;

export const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  artwork: "Artwork",
  proof: "Proof",
  approved: "Approved",
  production: "Production",
  shipped: "Shipped",
  delivered: "Delivered",
  changes_requested: "Changes requested",
};

export type Customer = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  notes: string;
  created_at: string;
};

export type QuoteRequestRow = {
  id: string;
  created_at: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  product_interest: string | null;
  quantity: number | null;
  decoration: string | null;
  required_by: string | null;
  budget: string | null;
  notes: string | null;
  file_paths: string[];
  status: QuoteRequestStatus;
  admin_notes: string;
  customer_id: string | null;
};

export type QuoteLineItem = {
  id?: string;
  description: string;
  product: string;
  decoration: string;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
  sort_order: number;
};

export type Quote = {
  id: string;
  number: string;
  customer_id: string;
  request_id: string | null;
  status: QuoteStatus;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  freight_cents: number;
  setup_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  valid_until: string | null;
  terms: string;
  notes: string;
  share_token: string;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
  customer?: Customer | null;
  line_items?: QuoteLineItem[];
};

export type Job = {
  id: string;
  number: string;
  customer_id: string;
  quote_id: string | null;
  title: string;
  stage: JobStage;
  due_date: string | null;
  tracking_number: string;
  supplier_reference: string;
  notes: string;
  share_token: string;
  created_at: string;
  customer?: Customer | null;
};

export type JobEvent = {
  id: string;
  job_id: string;
  kind: string;
  message: string;
  created_at: string;
};

export type Proof = {
  id: string;
  job_id: string;
  version: number;
  file_path: string;
  notes: string;
  status: ProofStatus;
  share_token: string;
  sent_at: string | null;
  responded_at: string | null;
  response_note: string;
  created_at: string;
  signed_url?: string | null;
  job?: Job | null;
};

export type Invoice = {
  id: string;
  number: string;
  customer_id: string;
  quote_id: string | null;
  job_id: string | null;
  kind: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  share_token: string;
  paid_at: string | null;
  last_reminder_at: string | null;
  created_at: string;
  customer?: Customer | null;
};

export type DashboardSummary = {
  newRequests: number;
  openQuotes: number;
  quotedValueCents: number;
  jobsDueSoon: number;
  proofsAwaiting: number
  unpaidInvoices: number;
  unpaidValueCents: number;
  paidThisMonthCents: number;
};
