create table if not exists public.catalog_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  image_code text not null,
  image_url text not null,
  source_filename text not null default '',
  colour_label text,
  shot_type text not null default 'Gallery',
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (product_id, image_code)
);

create table if not exists public.catalog_product_colours (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  colour_code text not null,
  colour_name text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (product_id, colour_code)
);

create unique index if not exists catalog_products_plu_unique_idx
  on public.catalog_products (plu)
  where plu is not null and plu <> '';

create index if not exists catalog_product_images_product_id_idx
  on public.catalog_product_images (product_id, sort_order);

create index if not exists catalog_product_colours_product_id_idx
  on public.catalog_product_colours (product_id, sort_order);

alter table public.catalog_product_images enable row level security;
alter table public.catalog_product_colours enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'catalog_product_images'
      and policyname = 'Public can read catalogue product images'
  ) then
    create policy "Public can read catalogue product images"
      on public.catalog_product_images
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'catalog_product_colours'
      and policyname = 'Public can read catalogue product colours'
  ) then
    create policy "Public can read catalogue product colours"
      on public.catalog_product_colours
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;
