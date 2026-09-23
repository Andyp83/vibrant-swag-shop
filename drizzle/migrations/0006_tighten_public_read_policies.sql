-- Replace blanket USING (true) public SELECT policies with real predicates that
-- only expose visible/published catalogue content. Admin "manage" ALL policies
-- remain, so staff still see hidden/draft rows.

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.catalog_categories;
CREATE POLICY "Visible categories are publicly readable"
ON public.catalog_categories
FOR SELECT
TO anon, authenticated
USING (is_hidden = false);

DROP POLICY IF EXISTS "Subcategories are publicly readable" ON public.catalog_subcategories;
CREATE POLICY "Visible subcategories are publicly readable"
ON public.catalog_subcategories
FOR SELECT
TO anon, authenticated
USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1 FROM public.catalog_categories c
    WHERE c.id = catalog_subcategories.category_id AND c.is_hidden = false
  )
);

DROP POLICY IF EXISTS "Products are publicly readable" ON public.catalog_products;
CREATE POLICY "Published products are publicly readable"
ON public.catalog_products
FOR SELECT
TO anon, authenticated
USING (publish_status = 'published');

DROP POLICY IF EXISTS "Public can read catalogue product images" ON public.catalog_product_images;
CREATE POLICY "Published product images are publicly readable"
ON public.catalog_product_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.catalog_products p
    WHERE p.id = catalog_product_images.product_id
      AND p.publish_status = 'published'
  )
);

DROP POLICY IF EXISTS "Public can read catalogue product colours" ON public.catalog_product_colours;
CREATE POLICY "Published product colours are publicly readable"
ON public.catalog_product_colours
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.catalog_products p
    WHERE p.id = catalog_product_colours.product_id
      AND p.publish_status = 'published'
  )
);

DROP POLICY IF EXISTS "Banners are publicly readable" ON public.site_banners;
CREATE POLICY "Active banners are publicly readable"
ON public.site_banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Quote request submissions stay open, but each written row must be a genuine
-- new enquiry: no self-assigned status, staff notes, customer link or backdating.
DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quote_requests;
CREATE POLICY "Anyone can submit a new quote request"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'::quote_request_status
  AND customer_id IS NULL
  AND admin_notes = ''
  AND confirmation_sent_at IS NULL
  AND length(btrim(name)) BETWEEN 1 AND 200
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  AND length(email) <= 320
  AND coalesce(length(notes), 0) <= 5000
  AND coalesce(length(product_interest), 0) <= 500
  AND coalesce(array_length(file_paths, 1), 0) <= 20
);
