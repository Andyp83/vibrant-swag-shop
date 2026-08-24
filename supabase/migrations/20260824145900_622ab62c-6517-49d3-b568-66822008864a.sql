ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS notify_proof_signed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_invoice_available boolean NOT NULL DEFAULT true;