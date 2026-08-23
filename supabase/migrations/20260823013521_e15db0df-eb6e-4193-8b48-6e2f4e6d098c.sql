CREATE TABLE public.catalog_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

GRANT SELECT ON public.catalog_subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_subcategories TO authenticated;
GRANT ALL ON public.catalog_subcategories TO service_role;

ALTER TABLE public.catalog_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcategories are publicly readable" ON public.catalog_subcategories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage subcategories" ON public.catalog_subcategories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER update_catalog_subcategories_updated_at BEFORE UPDATE ON public.catalog_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.catalog_categories (slug, name, tagline, description, colour, image_url, hero_image_url, sort_order) VALUES
  ('pens', 'Pens', 'Write it, brand it', 'Metal, bamboo, plastic and novelty pens, highlighters, stylus pens and refills — the most cost-effective branded giveaway there is, with a huge range of barrel finishes and print areas.', 'blue', '/api/public/catalog-image/categories/cat-pens-blue.png', '/api/public/catalog-image/categories/cat-pens-blue.png', 11),
  ('print', 'Print', 'Labels, cards, signage', 'Printed collateral that finishes the job: ad labels, business cards, magnets, pads, resin labels, ribbons and signage, produced to match your brand exactly.', 'sand', '/api/public/catalog-image/categories/cat-print-sand.png', '/api/public/catalog-image/categories/cat-print-sand.png', 12)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.catalog_subcategories (category_id, slug, name, sort_order)
SELECT c.id,
       trim(both '-' from lower(regexp_replace(x.name, '[^a-zA-Z0-9]+', '-', 'g'))),
       x.name,
       x.ord
FROM (VALUES
  ('pens', ARRAY['Bamboo','Black Refill','Blue Refill','Deluxe','Highlighter','Metal','Mix & Match','Novelty','Paper','Plastic','Presentation','Refills','Stylus','Wood']),
  ('apparel', ARRAY['Accessories','Aprons','Jackets','Polos','Shirts','Socks & Footwear','Sweatpants','Sweatshirts','T-Shirts','Teamwear']),
  ('drinkware', ARRAY['Ceramic Mugs','Coffee Cups','Cups & Tumblers','Drink Bottles','Drink Bottles - Glass','Drink Bottles - Metal','Drink Bottles - Plastic','Drinkware Presentation','Flasks','Glassware','Outdoor Hospitality','Paper Cups','Sports Shakers','Teaware','Travel Mugs']),
  ('business-items', ARRAY['Colouring Sets','Desk Items','Diaries & Planners','Highlighters','ID Holders','Lanyards','Note Pads','Notebooks','Pencil Cases','Portfolios','Rulers','Stationery','Sticky Notes']),
  ('print', ARRAY['Ad Labels','Business Cards','Magnets','Pads','Resin Labels','Ribbons & Accessories','Signage']),
  ('packaging', ARRAY['Gift Bags','Gift Boxes','Gift Tubes','Kitting','Packaging Accessories','Paper Bags','Pouches','Ribbons','Wine Boxes']),
  ('promotional', ARRAY['Badges','Bar Mats','Beach Balls','Bottle Openers','Confectionery','Fidget Items','Key Rings','Pet Accessories','Plush Toys','Promotional','Stress Items','Stubby & Can Holders','Temporary Tattoos','Wristbands']),
  ('tech', ARRAY['Bluetooth Trackers','Car USB Chargers','Charging Cables','Earbuds','Flash Drives','Headphones','Laptop Bags','Mouse Mats','Phone Wallets','Power Banks','Screen Cleaners','Sleeves & Cases','Speakers','Stands & Holders','Tech Accessories','USB Hubs','Wireless Chargers']),
  ('bags', ARRAY['Backpacks','Conference Bags','Cooler Bags','Cotton Bags','Crossbody & Belt Bags','Drawstring Bags','Dry Bags','Duffle Bags','Gift Bags','Jute Bags','Laptop Bags','Lunch Bags','Other Bags','Paper Bags','Satchel Bags','Shopping Bags','Sport Bags','Suitcases','Toiletry Bags','Tote Bags','Wine Carriers']),
  ('personal-products', ARRAY['Candles & Diffusers','Face Masks','First Aid','Hand Sanitiser','Lip Balms','Lotions & Sunscreens','Personal Care']),
  ('outdoor-leisure', ARRAY['Blankets','Camping & Outdoors','Chairs','Cheese & Serving Boards','Coasters','Games & Puzzles','Golf','Home & Living','Models','Picnic & BBQ','Sport','Sports Balls','Sunglasses','Tools','Torches & Lights','Towels','Travel','Umbrellas'])
) AS v(cat_slug, names)
CROSS JOIN LATERAL unnest(v.names) WITH ORDINALITY AS x(name, ord)
JOIN public.catalog_categories c ON c.slug = v.cat_slug
ON CONFLICT (category_id, slug) DO NOTHING;