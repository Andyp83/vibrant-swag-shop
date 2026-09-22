-- 1. Exact, case-insensitive email lookups (no LIKE metacharacters involved)
CREATE INDEX IF NOT EXISTS quote_requests_lower_email_idx
  ON public.quote_requests (lower(email));

CREATE OR REPLACE FUNCTION public.customers_by_email(p_email text)
RETURNS SETOF public.customers
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM public.customers
  WHERE lower(email) = lower(p_email)
  ORDER BY created_at ASC
$$;

CREATE OR REPLACE FUNCTION public.quote_requests_by_email(p_email text)
RETURNS SETOF public.quote_requests
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM public.quote_requests
  WHERE lower(email) = lower(p_email)
  ORDER BY created_at DESC
$$;

REVOKE ALL ON FUNCTION public.customers_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.quote_requests_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customers_by_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.quote_requests_by_email(text) TO authenticated, service_role;

-- 2. Payment environment binding + idempotent, atomic settlement
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_environment text;

COMMENT ON COLUMN public.invoices.payment_environment IS
  'Stripe mode (sandbox|live) the checkout session was created in; webhook events from another mode cannot settle this invoice.';

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_reference_key
  ON public.payments (provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.settle_invoice_payment(
  p_invoice_id uuid,
  p_session_id text,
  p_amount_cents integer,
  p_currency text,
  p_provider_reference text,
  p_environment text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.invoices;
BEGIN
  IF p_environment NOT IN ('sandbox', 'live') THEN
    RETURN 'invalid_environment';
  END IF;

  SELECT * INTO v FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'unknown_invoice';
  END IF;

  IF coalesce(v.payment_environment, p_environment) <> p_environment THEN
    RETURN 'environment_mismatch';
  END IF;

  IF v.stripe_session_id IS DISTINCT FROM p_session_id THEN
    RETURN 'session_mismatch';
  END IF;

  IF v.amount_cents <> p_amount_cents THEN
    RETURN 'amount_mismatch';
  END IF;

  IF upper(v.currency) <> upper(p_currency) THEN
    RETURN 'currency_mismatch';
  END IF;

  IF v.status = 'void' THEN
    RETURN 'void';
  END IF;

  INSERT INTO public.payments (
    invoice_id, amount_cents, currency, provider, provider_reference, status, environment
  ) VALUES (
    v.id, p_amount_cents, upper(p_currency), 'stripe', p_provider_reference, 'succeeded', p_environment
  )
  ON CONFLICT (provider, provider_reference) WHERE provider_reference IS NOT NULL DO NOTHING;

  IF v.status = 'paid' THEN
    RETURN 'already_paid';
  END IF;

  UPDATE public.invoices
     SET status = 'paid',
         paid_at = now(),
         payment_environment = p_environment
   WHERE id = v.id;

  RETURN 'paid';
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_invoice_payment_failed(
  p_invoice_id uuid,
  p_session_id text,
  p_environment text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.invoices;
BEGIN
  SELECT * INTO v FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'unknown_invoice';
  END IF;
  IF coalesce(v.payment_environment, p_environment) <> p_environment THEN
    RETURN 'environment_mismatch';
  END IF;
  IF v.stripe_session_id IS DISTINCT FROM p_session_id THEN
    RETURN 'session_mismatch';
  END IF;
  -- A late failure event must never reverse a settled or cancelled invoice.
  IF v.status IN ('paid', 'void') THEN
    RETURN 'ignored';
  END IF;

  UPDATE public.invoices SET status = 'overdue' WHERE id = v.id;
  RETURN 'overdue';
END;
$$;

REVOKE ALL ON FUNCTION public.settle_invoice_payment(uuid, text, integer, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_invoice_payment_failed(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_invoice_payment(uuid, text, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_invoice_payment_failed(uuid, text, text) TO service_role;