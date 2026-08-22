alter table public.catalog_categories add column if not exists hero_image_url text;

-- keep the new colour-blocked photos for the individual category pages
update public.catalog_categories set hero_image_url = image_url;

-- restore the previous homepage tile images
update public.catalog_categories set image_url = case slug
  when 'drinkware' then '/__l5e/assets-v1/4be2d817-3e51-4519-90d6-b35fa9fff433/cat-drinkware-flat.png'
  when 'promotional' then '/__l5e/assets-v1/163a0a83-6bf9-4679-98ea-9b28424100da/cat-promotional-flat.png'
  when 'headwear' then '/__l5e/assets-v1/13331297-2098-4855-aaa5-1a5c2bdb0950/cat-headwear-flat.png'
  when 'business-items' then '/__l5e/assets-v1/8b6e2609-1579-4671-a212-5a6a913740e5/cat-business-items-flat.png'
  when 'outdoor-leisure' then '/__l5e/assets-v1/4b4330a2-91f5-4220-9835-d75248bad07d/cat-outdoor-leisure-flat.png'
  when 'gift-packs' then '/__l5e/assets-v1/7980521e-18d9-48e5-8958-ae9f229aa3d0/cat-gift-packs-flat.png'
  when 'bags' then '/__l5e/assets-v1/b0bf67df-22cb-4c0c-a524-16cfba36ed9f/cat-bags-flat.png'
  when 'apparel' then '/__l5e/assets-v1/7da61d17-8c3c-493a-b87b-bc69d97c8082/cat-apparel-navy-pop.png'
  when 'packaging' then '/__l5e/assets-v1/c28272dc-2fe2-4105-8c11-bf90c951d4fa/cat-packaging-flat.png'
  when 'personal-products' then '/__l5e/assets-v1/898cba79-b788-4ade-a81a-d78f834cfa23/cat-personal-magenta-v2.png'
  when 'tech' then '/__l5e/assets-v1/1d9cd6fc-f030-4d3e-915f-63abd7ecb4cc/cat-tech-pink.png'
  else image_url end;