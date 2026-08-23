ALTER TABLE public.catalog_products
  ADD COLUMN subcategory_id uuid REFERENCES public.catalog_subcategories(id) ON DELETE SET NULL;

CREATE INDEX catalog_products_subcategory_id_idx ON public.catalog_products (subcategory_id);