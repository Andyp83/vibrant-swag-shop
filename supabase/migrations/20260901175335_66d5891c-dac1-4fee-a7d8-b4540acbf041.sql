ALTER TABLE public.catalog_products
  ADD COLUMN moq_min integer GENERATED ALWAYS AS (
    nullif(regexp_replace(coalesce(moq,''), '^\D*(\d+).*$', '\1'), coalesce(moq,''))::integer
  ) STORED,
  ADD COLUMN colour_search text GENERATED ALWAYS AS (
    lower(coalesce(colours,'') || ' ' || coalesce(colour_images::text, ''))
  ) STORED,
  ADD COLUMN colour_image_search text GENERATED ALWAYS AS (
    lower(coalesce(colour_images::text, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS catalog_products_moq_min_idx ON public.catalog_products (moq_min);
CREATE INDEX IF NOT EXISTS catalog_products_category_sort_idx ON public.catalog_products (category_id, sort_order, id);
CREATE INDEX IF NOT EXISTS catalog_products_subcategory_sort_idx ON public.catalog_products (subcategory_id, sort_order, id);
CREATE INDEX IF NOT EXISTS catalog_products_methods_idx ON public.catalog_products USING gin (methods);

CREATE OR REPLACE FUNCTION public.search_product_families(
  p_category_id uuid DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL,
  p_decoration text DEFAULT NULL,
  p_colour_terms text[] DEFAULT '{}'::text[],
  p_colour_mode text DEFAULT 'any',
  p_impact boolean DEFAULT false,
  p_moq_max integer DEFAULT 0,
  p_sort text DEFAULT 'default',
  p_limit integer DEFAULT 60,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
WITH filtered AS (
  SELECT
    p.id, p.category_id, p.subcategory_id, p.slug, p.plu, p.name, p.blurb, p.service,
    p.colours, p.material_group, p.moq, p.methods, p.image_url, p.colour_images,
    p.variant_group, p.variant_label, p.impact_aware, p.sort_order,
    coalesce(p.variant_group, p.id::text) AS family_key,
    (SELECT count(*) FROM unnest(p_colour_terms) t WHERE p.colour_image_search ~ t) * 2
      + (SELECT count(*) FROM unnest(p_colour_terms) t WHERE p.colour_search ~ t) AS colour_score
  FROM catalog_products p
  WHERE (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_subcategory_id IS NULL OR p.subcategory_id = p_subcategory_id)
    AND (p_decoration IS NULL OR p.methods @> ARRAY[p_decoration])
    AND (NOT p_impact OR p.impact_aware)
    AND (p_moq_max = 0 OR (p.moq_min IS NOT NULL AND p.moq_min <= p_moq_max))
    AND (
      coalesce(array_length(p_colour_terms, 1), 0) = 0
      OR (
        CASE WHEN p_colour_mode = 'all'
          THEN NOT EXISTS (SELECT 1 FROM unnest(p_colour_terms) t WHERE p.colour_search !~ t)
          ELSE EXISTS (SELECT 1 FROM unnest(p_colour_terms) t WHERE p.colour_search ~ t)
        END
      )
    )
),
ranked AS (
  SELECT f.*,
    row_number() OVER (PARTITION BY f.family_key ORDER BY (f.image_url IS NULL), f.sort_order, f.id) AS rn,
    max(f.colour_score) OVER (PARTITION BY f.family_key) AS family_score,
    min(f.sort_order) OVER (PARTITION BY f.family_key) AS family_sort
  FROM filtered f
),
fams AS (
  SELECT family_key, family_sort, family_score FROM ranked WHERE rn = 1
),
page AS (
  SELECT family_key,
    row_number() OVER (
      ORDER BY CASE WHEN p_sort = 'colour-match' THEN -family_score ELSE 0 END, family_sort, family_key
    ) AS ord
  FROM fams
  ORDER BY CASE WHEN p_sort = 'colour-match' THEN -family_score ELSE 0 END, family_sort, family_key
  LIMIT greatest(p_limit, 0) OFFSET greatest(p_offset, 0)
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM fams),
  'families', coalesce((
    SELECT jsonb_agg(
      jsonb_build_object(
        'key', pg.family_key,
        'variants', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', r.id, 'category_id', r.category_id, 'subcategory_id', r.subcategory_id,
              'slug', r.slug, 'plu', r.plu, 'name', r.name, 'blurb', r.blurb, 'service', r.service,
              'colours', r.colours, 'material_group', r.material_group, 'moq', r.moq,
              'methods', r.methods, 'image_url', r.image_url, 'colour_images', r.colour_images,
              'variant_group', r.variant_group, 'variant_label', r.variant_label,
              'impact_aware', r.impact_aware, 'sort_order', r.sort_order
            )
            ORDER BY (r.image_url IS NULL), r.sort_order, r.id
          )
          FROM ranked r WHERE r.family_key = pg.family_key
        )
      )
      ORDER BY pg.ord
    )
    FROM page pg
  ), '[]'::jsonb)
);
$$;

GRANT EXECUTE ON FUNCTION public.search_product_families(uuid, uuid, text, text[], text, boolean, integer, text, integer, integer) TO anon, authenticated, service_role;