alter table public.catalog_products
  add column if not exists slug text not null default '',
  add column if not exists plu text,
  add column if not exists service text not null default '',
  add column if not exists description text not null default '',
  add column if not exists features text not null default '',
  add column if not exists specifications text not null default '',
  add column if not exists dimensions text not null default '',
  add column if not exists materials text not null default '',
  add column if not exists material_group text not null default 'General',
  add column if not exists branding_options text not null default '',
  add column if not exists packaging text not null default '',
  add column if not exists carton_details text not null default '',
  add column if not exists source_url text;

update public.catalog_products
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug = '';

update public.catalog_products
set material_group = 'General'
where material_group = '';

create unique index if not exists catalog_products_plu_unique_idx
  on public.catalog_products (plu)
  where plu is not null and plu <> '';

create index if not exists catalog_products_slug_idx
  on public.catalog_products (slug);

create index if not exists catalog_products_material_group_idx
  on public.catalog_products (material_group);
