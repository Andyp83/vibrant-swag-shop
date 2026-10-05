CREATE TABLE public.stg_trends_products (plu text PRIMARY KEY, name text, service text, description text, features text, specifications text, colours_source text, canonical_colours_json jsonb, dimensions text, materials text, branding_options text, packaging text, carton_details text, carton_notes text, source_categories text, web_status text, source_url text, scrape_status text, source_used text, source_image_count int, site_images_json jsonb, source_row_order int);
CREATE TABLE public.stg_trends_images (plu text, product_name text, image_code text, source_filename text, image_url text, image_sequence int, colour_label text, shot_type text, assignment_method text, confidence numeric, PRIMARY KEY (plu, image_code));
GRANT ALL ON public.stg_trends_products, public.stg_trends_images TO service_role;
ALTER TABLE public.stg_trends_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_trends_images ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.stg_trends_products IS 'Temporary staging for Trends catalogue refresh; not read by the app.';
COMMENT ON TABLE public.stg_trends_images IS 'Temporary staging for Trends catalogue refresh; not read by the app.';