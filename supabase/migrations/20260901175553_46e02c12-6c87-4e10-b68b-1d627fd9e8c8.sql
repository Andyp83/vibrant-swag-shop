CREATE OR REPLACE FUNCTION public.catalog_decoration_methods()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT coalesce(array_agg(m ORDER BY m), '{}'::text[])
  FROM (SELECT DISTINCT m FROM catalog_products p, unnest(p.methods) m WHERE m <> '') s;
$$;

GRANT EXECUTE ON FUNCTION public.catalog_decoration_methods() TO anon, authenticated, service_role;