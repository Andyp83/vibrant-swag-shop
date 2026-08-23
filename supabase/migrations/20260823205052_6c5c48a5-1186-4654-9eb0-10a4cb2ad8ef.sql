ALTER TABLE public.proofs
  ADD COLUMN IF NOT EXISTS signed_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS signed_at timestamptz;

CREATE TABLE public.customer_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_uploads TO authenticated;
GRANT ALL ON public.customer_uploads TO service_role;

ALTER TABLE public.customer_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage customer uploads" ON public.customer_uploads
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE INDEX customer_uploads_customer_idx ON public.customer_uploads (customer_id, created_at DESC);