CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_first_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_user_admin();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  colour text NOT NULL DEFAULT 'red',
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_categories TO authenticated;
GRANT ALL ON public.catalog_categories TO service_role;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.catalog_categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.catalog_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_catalog_categories_updated_at BEFORE UPDATE ON public.catalog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  colours text NOT NULL DEFAULT '',
  moq text NOT NULL DEFAULT '',
  methods text[] NOT NULL DEFAULT '{}'::text[],
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_products_category_idx ON public.catalog_products(category_id);
GRANT SELECT ON public.catalog_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_products TO authenticated;
GRANT ALL ON public.catalog_products TO service_role;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.catalog_products
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.catalog_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_catalog_products_updated_at BEFORE UPDATE ON public.catalog_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.catalog_categories (slug, name, tagline, description, colour, image_url, sort_order) VALUES
('drinkware','Drinkware','Bottles, tumblers, mugs','The category people actually keep. Vacuum bottles, ceramic mugs and reusable cups in a full spectrum of powder-coat colours.','red','/__l5e/assets-v1/bb361604-ab35-4ff9-b0a6-639f04ca1761/drinkware.jpg',0),
('apparel','Apparel','Tees, hoodies, polos','Uniform-grade blanks that survive a hundred washes, decorated with print or stitch depending on the look you want.','orange','/__l5e/assets-v1/59b3f1e1-6dfd-4ed4-aef4-0ebeb32c28a6/apparel.jpg',1),
('bags','Bags & Totes','Totes, backpacks, coolers','Big print areas and long shelf lives. The most cost-effective way to put your brand out on the street.','amber','/__l5e/assets-v1/31b17399-bd47-4f84-8415-2eefa0d34594/bags.jpg',2),
('tech','Tech & Power','Chargers, speakers, drives','High-perceived-value gifts for client thank-yous and executive kits. Compliance certificates supplied with every order.','blue','/__l5e/assets-v1/bf692415-b3d0-4bc5-8d26-c7a652efe414/tech.jpg',3),
('stationery','Stationery','Notebooks, pens, desk','Conference and onboarding staples. Notebooks bind in your brand colour; pens can be built from colour-matched components.','lime','/__l5e/assets-v1/6c50d705-82b8-4a69-9ae4-78b52da2b20e/stationery.jpg',4),
('eco','Eco & Sustainable','Recycled, bamboo, cork','Lower-impact alternatives across every category, with material certificates so your sustainability claims stand up.','green','/__l5e/assets-v1/108d66f3-9157-42f7-ba74-ac29ec330a41/eco.jpg',5),
('headwear','Headwear','Caps, beanies, bucket hats','Embroidery country. Six-panel caps, cuffed beanies and bucket hats with colour-matched stitching.','teal','/__l5e/assets-v1/3225e563-76cd-46a5-ac07-52e8761a1e03/headwear.jpg',6),
('gift-sets','Gift Sets','Onboarding & client kits','Curated boxes assembled, wrapped and drop-shipped to individual addresses. Choose the contents, we handle the rest.','magenta','/__l5e/assets-v1/82da2b6e-ad46-4821-91f3-c98de8ac4988/giftsets.jpg',7);

INSERT INTO public.catalog_products (category_id, name, blurb, colours, moq, methods, sort_order)
SELECT c.id, v.name, v.blurb, v.colours, v.moq, v.methods, v.sort_order
FROM (VALUES
('drinkware','Compadre Vacuum Bottle 750ml','Double-walled stainless steel with a flip-straw lid and carry loop.','17 powder-coat colours','MOQ 25',ARRAY['Laser engraving','Digital UV print','Full-colour wrap'],0),
('drinkware','Everyday Ceramic Mug 350ml','Chunky matte ceramic with a colour-matched interior.','9 colours','MOQ 36',ARRAY['Pad print','Digital UV print'],1),
('drinkware','Commuter Travel Tumbler 450ml','Leak-proof sipper lid, fits a standard cup holder.','8 colours','MOQ 50',ARRAY['Laser engraving','Pad print'],2),
('drinkware','Recycled rPET Sports Bottle 800ml','Tritan-clear body made from post-consumer plastic.','6 tints + clear','MOQ 100',ARRAY['Screen print','Full-colour wrap'],3),
('drinkware','Barista Glass Cup 380ml','Borosilicate glass with a silicone grip band.','7 band colours','MOQ 48',ARRAY['Digital UV print','Doming'],4),
('drinkware','Can Cooler & Stubby Holder','Insulated stainless can holder for 375ml cans.','12 colours','MOQ 50',ARRAY['Laser engraving','Full-colour wrap'],5),
('apparel','Heavyweight Cotton Tee','220gsm combed cotton, unisex fit, side-seamed.','24 colours','MOQ 20',ARRAY['Screen print','Embroidery','Digital UV print'],0),
('apparel','Brushed Fleece Hoodie','320gsm fleece with a double-lined hood and kangaroo pocket.','14 colours','MOQ 20',ARRAY['Screen print','Embroidery'],1),
('apparel','Performance Polo','Moisture-wicking pique with a soft-touch collar.','16 colours','MOQ 24',ARRAY['Embroidery','Screen print'],2),
('apparel','Hi-Vis Safety Vest','Day/night compliant with reflective taping.','Yellow, orange','MOQ 25',ARRAY['Screen print'],3),
('apparel','Softshell Jacket','Water-resistant three-layer shell with zip pockets.','8 colours','MOQ 15',ARRAY['Embroidery'],4),
('apparel','Crew Sweatshirt','Classic loopback crew with ribbed cuffs.','12 colours','MOQ 20',ARRAY['Screen print','Embroidery'],5),
('bags','Heavy Canvas Tote','12oz cotton canvas with reinforced long handles.','10 colours + natural','MOQ 50',ARRAY['Screen print','Embroidery'],0),
('bags','Everyday Laptop Backpack','Padded 15" sleeve, luggage passthrough, water bottle pocket.','6 colours','MOQ 25',ARRAY['Embroidery','Debossing'],1),
('bags','Drawstring Sport Pack','Lightweight cinch bag, ideal for events and giveaways.','12 colours','MOQ 100',ARRAY['Screen print','Full-colour wrap'],2),
('bags','Insulated Cooler Bag 12L','Leak-resistant lining, holds 18 cans plus ice.','7 colours','MOQ 50',ARRAY['Screen print','Embroidery'],3),
('bags','Recycled Kraft Gift Bag','Rope-handled paper bag for onboarding kits.','5 colours','MOQ 100',ARRAY['Screen print','Digital UV print'],4),
('bags','Weekender Duffle','600D poly duffle with a separate shoe compartment.','5 colours','MOQ 25',ARRAY['Embroidery','Screen print'],5),
('tech','10,000mAh Power Bank','USB-C in/out, LED charge indicator, pass-through charging.','6 colours','MOQ 25',ARRAY['Laser engraving','Digital UV print'],0),
('tech','Wireless Charging Pad','15W fast charge with a soft-touch finish and huge print area.','4 colours','MOQ 50',ARRAY['Digital UV print','Doming'],1),
('tech','Pocket Bluetooth Speaker','Fabric-wrapped, 8 hour playback, IPX5 splash resistant.','5 colours','MOQ 25',ARRAY['Pad print','Digital UV print'],2),
('tech','Twist USB Drive 32GB','Metal swivel casing, data preloading available.','10 colours','MOQ 50',ARRAY['Laser engraving','Pad print'],3),
('tech','Braided 3-in-1 Cable','USB-C, Lightning and micro-USB in one nylon cable.','6 colours','MOQ 100',ARRAY['Pad print','Doming'],4),
('tech','True Wireless Earbuds','Touch controls with a charging case that carries your mark.','3 colours','MOQ 25',ARRAY['Digital UV print','Laser engraving'],5),
('stationery','Hardcover A5 Notebook','Elastic closure, ribbon marker, 160 lined pages.','11 cover colours','MOQ 50',ARRAY['Debossing','Screen print','Digital UV print'],0),
('stationery','Cork-Bound Notebook','Natural cork cover with recycled paper stock.','Natural + 3 trims','MOQ 100',ARRAY['Laser engraving','Screen print'],1),
('stationery','Mix-and-Match Click Pen','Choose barrel, grip and clip colours independently.','14 component colours','MOQ 250',ARRAY['Pad print'],2),
('stationery','Aluminium Rollerball','Weighted metal body with a satin anodised finish.','8 colours','MOQ 100',ARRAY['Laser engraving'],3),
('stationery','Sticky Note Wallet','Card wallet with flags and a 50-sheet pad.','6 colours','MOQ 250',ARRAY['Digital UV print'],4),
('stationery','Desk Mat & Mouse Pad','Stitched-edge felt or PU mat, edge-to-edge printing.','5 colours','MOQ 100',ARRAY['Full-colour wrap','Digital UV print'],5),
('eco','Bamboo Cutlery Set','Fork, knife, spoon and chopsticks in a cotton roll.','4 pouch colours','MOQ 100',ARRAY['Laser engraving','Screen print'],0),
('eco','Recycled Cotton Tote','Made from 80% post-industrial recycled cotton.','5 colours','MOQ 100',ARRAY['Screen print'],1),
('eco','Wheat Straw Lunch Box','Bio-composite container with a bamboo lid and cutlery.','5 colours','MOQ 100',ARRAY['Pad print','Digital UV print'],2),
('eco','Seed Paper Card','Plantable card stock embedded with wildflower seed.','3 stocks','MOQ 250',ARRAY['Digital UV print'],3),
('eco','Recycled Ocean Plastic Bottle','rPET body traced to coastal collection programs.','6 colours','MOQ 100',ARRAY['Screen print','Full-colour wrap'],4),
('eco','Cork Desk Organiser','Solid cork tray for cables, cards and keys.','Natural','MOQ 50',ARRAY['Laser engraving'],5),
('headwear','Six-Panel Structured Cap','Cotton twill crown with a pre-curved peak and metal buckle.','18 colours','MOQ 25',ARRAY['Embroidery','Screen print'],0),
('headwear','Trucker Cap','Foam front panel with a breathable mesh back.','12 combos','MOQ 25',ARRAY['Embroidery','Doming'],1),
('headwear','Cuffed Acrylic Beanie','Fine-knit beanie with a fold cuff for badge placement.','15 colours','MOQ 25',ARRAY['Embroidery','Woven badge'],2),
('headwear','Bucket Hat','Soft cotton brim hat, festival and summer campaign favourite.','8 colours','MOQ 50',ARRAY['Embroidery','Screen print'],3),
('headwear','Five-Panel Flat Peak','Skate-style crown with a flat snapback closure.','10 colours','MOQ 50',ARRAY['Embroidery'],4),
('headwear','Performance Running Cap','Lightweight technical fabric with reflective trim.','6 colours','MOQ 50',ARRAY['Embroidery','Screen print'],5),
('gift-sets','New Starter Welcome Box','Bottle, notebook, pen and tee in a printed rigid box.','Box in any brand colour','MOQ 25',ARRAY['Digital UV print','Screen print','Embroidery'],0),
('gift-sets','Client Thank-You Kit','Premium drinkware, chocolate and a handwritten card.','6 box colours','MOQ 25',ARRAY['Debossing','Laser engraving'],1),
('gift-sets','Conference Delegate Pack','Tote, notebook, pen and lanyard, packed per delegate.','Mix and match','MOQ 100',ARRAY['Screen print','Digital UV print'],2),
('gift-sets','Work-From-Home Bundle','Desk mat, mug, charging pad and cable tidy.','4 palettes','MOQ 25',ARRAY['Digital UV print','Laser engraving'],3),
('gift-sets','Milestone Award Set','Engraved keepsake plus a personalised certificate.','3 finishes','MOQ 10',ARRAY['Laser engraving'],4),
('gift-sets','Eco Starter Kit','Bamboo cutlery, rPET bottle and recycled notebook.','Natural + green','MOQ 50',ARRAY['Laser engraving','Screen print'],5)
) AS v(slug, name, blurb, colours, moq, methods, sort_order)
JOIN public.catalog_categories c ON c.slug = v.slug;