ALTER TABLE public.catalog_products DROP COLUMN IF EXISTS moq_min;

ALTER TABLE public.catalog_products
  ADD COLUMN moq_min integer GENERATED ALWAYS AS (
    ((regexp_match(coalesce(moq, ''), '(\d+)'))[1])::integer
  ) STORED;

CREATE INDEX IF NOT EXISTS catalog_products_moq_min_idx ON public.catalog_products (moq_min);