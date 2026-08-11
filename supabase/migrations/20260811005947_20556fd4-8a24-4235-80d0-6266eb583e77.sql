UPDATE public.catalog_categories SET image_url = CASE slug
  WHEN 'drinkware' THEN '/__l5e/assets-v1/24382d71-89ad-40df-80ef-8c377514fb54/cat-drinkware.png'
  WHEN 'apparel' THEN '/__l5e/assets-v1/31c04ec4-a8e1-43e6-be61-c14b4d15cc29/cat-apparel.jpg'
  WHEN 'bags' THEN '/__l5e/assets-v1/b7c0eec7-7c04-4722-8372-d3caa6b0d109/cat-bags.jpg'
  WHEN 'tech' THEN '/__l5e/assets-v1/e0105b29-ee15-4056-a8ae-99f47b945621/cat-tech.jpg'
  WHEN 'stationery' THEN '/__l5e/assets-v1/8119c9cb-82e2-4c9a-8fbd-79072a92b9d9/cat-stationery.jpg'
  WHEN 'eco' THEN '/__l5e/assets-v1/0580141b-218c-496a-898f-22273056374f/cat-eco.jpg'
  WHEN 'headwear' THEN '/__l5e/assets-v1/a4135460-0f63-4095-b276-15be3c1768b4/cat-headwear.jpg'
  WHEN 'gift-sets' THEN '/__l5e/assets-v1/c4bdb8d7-63cf-4cd5-9b05-c49004cb7d58/cat-giftsets.jpg'
  ELSE image_url END
WHERE slug IN ('drinkware','apparel','bags','tech','stationery','eco','headwear','gift-sets');