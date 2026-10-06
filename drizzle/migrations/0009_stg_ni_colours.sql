CREATE TABLE IF NOT EXISTS public.stg_ni_colours (plu text not null, url text not null, colour text not null, seq int not null, code text not null, fname text not null);
REVOKE ALL ON public.stg_ni_colours FROM anon, authenticated;
GRANT ALL ON public.stg_ni_colours TO service_role;
ALTER TABLE public.stg_ni_colours ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.stg_ni_colours IS 'Temporary staging for NI image colour import';