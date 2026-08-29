CREATE INDEX IF NOT EXISTS catalog_products_sort_order_idx ON public.catalog_products (sort_order, id);
CREATE INDEX IF NOT EXISTS catalog_product_images_product_sort_idx ON public.catalog_product_images (product_id, sort_order);
CREATE INDEX IF NOT EXISTS catalog_product_colours_product_sort_idx ON public.catalog_product_colours (product_id, sort_order);