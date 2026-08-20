CREATE TYPE public.quote_request_status AS ENUM ('new','in_progress','quoted','won','lost');
CREATE TYPE public.quote_status AS ENUM ('draft','sent','accepted','declined','expired');
CREATE TYPE public.job_stage AS ENUM ('artwork','proof','approved','production','shipped','delivered');
CREATE TYPE public.proof_status AS ENUM ('sent','approved','changes_requested');
CREATE TYPE public.invoice_status AS ENUM ('draft','sent','paid','overdue','void');

CREATE SEQUENCE public.quote_number_seq START 1000;
CREATE SEQUENCE public.job_number_seq START 1000;
CREATE SEQUENCE public.invoice_number_seq START 1000;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text NOT NULL,
  phone text,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_email_key ON public.customers (lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quote_requests
  ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN status public.quote_request_status NOT NULL DEFAULT 'new',
  ADD COLUMN admin_notes text NOT NULL DEFAULT '';
CREATE POLICY "Admins view quote requests" ON public.quote_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update quote requests" ON public.quote_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT ('SSB-Q' || nextval('public.quote_number_seq')),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  status public.quote_status NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'AUD',
  subtotal_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  freight_cents integer NOT NULL DEFAULT 0,
  setup_cents integer NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 10,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  valid_until date,
  terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  product text NOT NULL DEFAULT '',
  decoration text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 0,
  amount_cents integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quote_line_items_quote_id_idx ON public.quote_line_items (quote_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_line_items TO authenticated;
GRANT ALL ON public.quote_line_items TO service_role;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quote line items" ON public.quote_line_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT ('SSB-J' || nextval('public.job_number_seq')),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  title text NOT NULL,
  stage public.job_stage NOT NULL DEFAULT 'artwork',
  due_date date,
  tracking_number text NOT NULL DEFAULT '',
  supplier_reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage jobs" ON public.jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_events_job_id_idx ON public.job_events (job_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_events TO authenticated;
GRANT ALL ON public.job_events TO service_role;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage job events" ON public.job_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  file_path text NOT NULL,
  notes text NOT NULL DEFAULT '',
  status public.proof_status NOT NULL DEFAULT 'sent',
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  sent_at timestamptz,
  responded_at timestamptz,
  response_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proofs_job_id_idx ON public.proofs (job_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT ALL ON public.proofs TO service_role;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage proofs" ON public.proofs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT ('SSB-I' || nextval('public.invoice_number_seq')),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'full',
  description text NOT NULL DEFAULT '',
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AUD',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  due_date date,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  stripe_session_id text,
  paid_at timestamptz,
  last_reminder_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AUD',
  provider text NOT NULL DEFAULT 'stripe',
  provider_reference text,
  status text NOT NULL DEFAULT 'succeeded',
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_invoice_id_idx ON public.payments (invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template text NOT NULL,
  related_type text,
  related_id uuid,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email log" ON public.email_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update proofs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete proofs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));