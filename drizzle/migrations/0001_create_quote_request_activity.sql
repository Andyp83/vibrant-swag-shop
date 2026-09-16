CREATE TABLE public.quote_request_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'upload',
  file_path text,
  file_name text,
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quote_request_activity_request_idx
  ON public.quote_request_activity (request_id, created_at DESC);

GRANT SELECT, INSERT ON public.quote_request_activity TO authenticated;
GRANT ALL ON public.quote_request_activity TO service_role;

ALTER TABLE public.quote_request_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage brief activity"
  ON public.quote_request_activity
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Brief owners read their activity"
  ON public.quote_request_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quote_requests r
      JOIN auth.users u ON u.id = auth.uid()
      WHERE r.id = quote_request_activity.request_id
        AND lower(r.email) = lower(u.email)
    )
  );

CREATE POLICY "Brief owners add their activity"
  ON public.quote_request_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.quote_requests r
      JOIN auth.users u ON u.id = auth.uid()
      WHERE r.id = quote_request_activity.request_id
        AND lower(r.email) = lower(u.email)
    )
  );