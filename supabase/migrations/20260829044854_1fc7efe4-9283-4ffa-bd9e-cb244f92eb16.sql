ALTER TABLE public.catalog_products
  ADD COLUMN IF NOT EXISTS variant_group text,
  ADD COLUMN IF NOT EXISTS variant_label text;

CREATE INDEX IF NOT EXISTS catalog_products_variant_group_idx
  ON public.catalog_products (variant_group);