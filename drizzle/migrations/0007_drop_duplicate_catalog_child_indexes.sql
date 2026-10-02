-- Each pair indexed identical (product_id, sort_order) columns; keep one per table.
DROP INDEX IF EXISTS public.catalog_product_images_product_sort_idx;
DROP INDEX IF EXISTS public.catalog_product_colours_product_sort_idx;