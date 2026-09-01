ALTER TABLE public.catalog_products
ADD COLUMN impact_aware boolean
GENERATED ALWAYS AS (
  (coalesce(name,'') || ' ' || coalesce(blurb,'') || ' ' || coalesce(description,'') || ' ' || coalesce(features,'') || ' ' || coalesce(materials,'') || ' ' || coalesce(colours,''))
  ~* '(recycl|rpet|bamboo|organic|sustainab|eco|biodegrad|compost|cork|wheat|plant.based|reusab|seed|natural|bio|kraft)'
) STORED;

CREATE INDEX IF NOT EXISTS catalog_products_impact_aware_idx ON public.catalog_products (impact_aware);