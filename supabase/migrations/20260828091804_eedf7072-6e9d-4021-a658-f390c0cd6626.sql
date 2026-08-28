ALTER TABLE public.catalog_products
  ADD COLUMN IF NOT EXISTS colour_images jsonb NOT NULL DEFAULT '[]'::jsonb;