CREATE TABLE public.site_banners (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  image_url text not null,
  alt text not null default '',
  link_to text,
  cta text,
  placements text[] not null default '{}'::text[],
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.site_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_banners TO authenticated;
GRANT ALL ON public.site_banners TO service_role;

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are publicly readable" ON public.site_banners
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage banners" ON public.site_banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_banners_updated_at
  BEFORE UPDATE ON public.site_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_banners (key, image_url, alt, link_to, cta, placements) VALUES
('archer','/__l5e/assets-v1/f29052a3-fad4-40ec-bdbf-3bb0bef664e0/Archer-Launch_LWB_1.jpg','Archer bag range launch banner — for life in motion','/products/bags','See the bag range',ARRAY['category:bags']::text[]),
('aura','/__l5e/assets-v1/fd0585e4-9d93-4c1d-8813-de8690d15419/Aura_LWB.jpg','Aura vacuum bottle range shown across a full rainbow of colourways','/colour-guide','Browse the colour guide',ARRAY['category:drinkware']::text[]),
('camaro','/__l5e/assets-v1/120b936f-c1dd-4cde-8158-e78b56e0ef0d/Camaro_LWB_Unbranded.jpg','Camaro vacuum bottle in sixteen colours, one signature shape','/products/drinkware','See drinkware',ARRAY['category:drinkware']::text[]),
('digiflex','/__l5e/assets-v1/160c58df-8254-45ea-9f33-7b299c3de875/Distributor-LWB.jpg','DigiFlex Transfer — personalised full-colour designs on apparel and bags','/decoration','Compare decoration methods',ARRAY['category:apparel','decoration']::text[]),
('prism','/__l5e/assets-v1/4362ead7-9afb-4f4b-a5a7-0acd829521be/Prism-Digital-Print_-SWB.jpg','Prism Print — full colour, high-gloss branding for a lasting impact','/decoration#prism-digital-print','About Prism Digital Print',ARRAY['decoration']::text[]),
('puff','/__l5e/assets-v1/d9ee07c8-4e5b-409f-8552-24b52cb9a26a/Puff_Print_LWB.jpg','Puff Print — raised texture printing on branded apparel','/decoration#screen-print','About screen print',ARRAY['category:apparel','decoration']::text[]),
('impactAware','/__l5e/assets-v1/b121e33c-98f3-40fb-9179-cd716100e996/Impact_Aware_LWB.jpg','Impact Aware — designed with tomorrow in mind, recycled and natural materials',null,null,ARRAY['category:outdoor-leisure']::text[]),
('brandcraft','/__l5e/assets-v1/73f956d0-1021-409d-9eea-7715b10104ff/Large_Web_Banner_-_BRANDCRAFT.jpg','Brandcraft flat-pack cardboard model kits branded in full colour','/products/promotional','See promotional items',ARRAY['category:promotional']::text[]),
('bodum','/__l5e/assets-v1/a305e2b8-a847-493b-8ec2-7bfd05c9872f/SWB-Distributor.jpg','Bodum glassware and coffee presses — for the perfect brew','/products/drinkware','See drinkware',ARRAY['category:drinkware']::text[]),
('kadi','/__l5e/assets-v1/af90fea3-ccde-4979-87e1-9afae5eb8aec/Small_Web_Banner_-_Kadi_AU_Only_1.jpg','Kadi hard-shell luggage range with a debossed logo','/products/bags','See the bag range',ARRAY['category:bags']::text[]),
('mcScreenPrint','/__l5e/assets-v1/9afcb7e9-380c-402f-808b-3878c1d9d4c3/MC_Screen_Print_-_Large_Banner.jpg_','Multi-colour rotary screen printing on drink bottles with tight registration','/decoration#screen-print','About screen print',ARRAY['decoration']::text[]),
('mcPadPrint','/__l5e/assets-v1/9b95bd18-ab95-4090-9b75-f2cd49138736/Multi-Colour_Pad_Print_-_Large_Banner.jpg_','Multi-colour pad printing on a silicone cup band, up to five colours','/decoration#pad-print','About pad print',ARRAY['decoration']::text[]),
('siliconeDigital','/__l5e/assets-v1/71b29923-7358-4f24-ab88-ae2f9557d0f8/Silicone_Digital_Print_-_Large_Banner.jpg_','Silicone digital print — full-colour photographic branding on reusable cups','/decoration#silicone-digital-print','About Silicone Digital Print',ARRAY['decoration']::text[]),
('thermoDebossing','/__l5e/assets-v1/707c86ac-a9c5-484f-ace7-101ae53c3f68/Thermo_Debossing_-_Mini_Banner.jpg_','Thermo debossing pressing a logo into a soft-touch notebook cover','/decoration#debossing','About debossing',ARRAY['decoration']::text[]),
('colourflex','/__l5e/assets-v1/c22290d7-ca30-485d-86bc-7cbc6c9a2e87/1920x450px_Web_Banner_Colourflex_B.jpg_','Colourflex high-impact branding on bags, towels and hoodies','/decoration#colourflex-transfer','About Colourflex transfer',ARRAY['category:apparel','decoration']::text[]),
('camelbak','/__l5e/assets-v1/14077545-d408-4a92-b6c4-cdfd4dfa3563/CamelBak_-_Large_Web_Banner.jpg_','CamelBak bottles and hydration packs — unleash your brand on every adventure','/products/drinkware','See drinkware',ARRAY['category:drinkware']::text[]),
('skullcandy','/__l5e/assets-v1/5ffcdac9-d8ee-42d6-9569-cd40406603f8/1920x450px-SkullCandy_LWB.jpg_','Skullcandy headphones and earbuds — music you can feel','/products/tech','See tech gifts',ARRAY['category:tech']::text[]),
('lookbookLwb','/__l5e/assets-v1/b92249c3-ddcd-4daf-80b4-f4326d340baa/Brands_Lookbook_LWB.jpg','Brands Lookbook out now — branded bags, drinkware, audio and apparel','/lookbook','Open the Brands Lookbook',ARRAY[]::text[]),
('lookbookSwb','/__l5e/assets-v1/38bb6a8e-4ab3-4546-bec0-f4c1de0893cf/Brands_Lookbook_SWB.jpg','Brands Lookbook out now, shown open across two spreads','/lookbook','Open the Brands Lookbook',ARRAY[]::text[]),
('keepsake','/__l5e/assets-v1/b2600f41-1bc3-4fca-aa78-ef5b0a78a16b/Keepsake_SWB.jpg','Keepsake Collection — premium wine and glassware gifting on a hillside table','/products/promotional','See the Keepsake gifting range',ARRAY['category:promotional']::text[]),
('fullColourTowels','/__l5e/assets-v1/367afc0b-f76f-4a81-b2ed-cbdb1c34507c/1920x450px-Full-Colour-Towels_LWB.jpg','Full-colour sublimation towels printed in-house for events and summer campaigns','/decoration#sublimation-print','About Sublimation Print',ARRAY['category:apparel','decoration']::text[]),
('customPackaging','/__l5e/assets-v1/210f14a2-5c85-4088-8bbe-2102ffcb5cd7/Custom_Packaging_LWB.jpg','Custom printed packaging — CMYK digital printed mailer boxes with no minimum order','/products/packaging','See packaging',ARRAY['category:packaging']::text[]),
('rotaryVarnish','/__l5e/assets-v1/e8a4ec46-9ad9-4092-b385-3af4a293edf5/Rotary_Digital_Varnish_LWB_4.jpg','Rotary digital print on drinkware now with a stunning gloss varnish finish','/decoration#rotary-digital-print','About Rotary Digital Print',ARRAY['decoration']::text[]),
('alchemy','/__l5e/assets-v1/0ca6af2c-3b46-4fe0-92ad-f2b9fc8f0676/Alchemy_New_Colours_LWB_3.jpg','All new Alchemy glass tumblers with bamboo lids in eight new silicone sleeve colours','/products/drinkware','See drinkware',ARRAY['category:drinkware']::text[]),
('brandcraftSwb','/__l5e/assets-v1/48657087-7b87-49c3-833b-e8b4754ed79a/BrandCraft_SWB.jpg','Brandcraft flat-pack cardboard vehicles and animals ready for full-colour branding','/products/promotional','See promotional items',ARRAY['category:promotional']::text[]),
('oceanBottle','/__l5e/assets-v1/b568e11d-9c65-418b-8dbb-b171c4d8e4b2/Ocean-Bottle_LWB.jpg','Ocean Bottle — planet-positive reusable bottles making refilling everyday behaviour','/products/outdoor-leisure','See the eco range',ARRAY['category:outdoor-leisure']::text[]),
('foilPrinting','/__l5e/assets-v1/d4322656-998f-4ba1-8ea3-cf1784c0373f/Foil_Printing_LWB_2_Oct_2024_NB.jpg','Foil printing on notebooks in gold, copper and silver for a premium finish','/decoration#debossing','About premium finishes',ARRAY['category:packaging','decoration']::text[]),
('blindDebossing','/__l5e/assets-v1/6aae78a4-24aa-4e40-aa56-1a34b6cb2c52/1920x450px-Thermo-and-Blind-Debossing_LWB.jpg','Thermo and blind debossing pressing logos into soft-touch notebook covers','/decoration#debossing','About debossing',ARRAY['category:packaging','decoration']::text[]),
('boxSleeves','/__l5e/assets-v1/e67a8263-3c8a-4a9b-9f7f-73a636d71f1b/1920x450px-Drinkware-Box-Sleeves_LWB_GENERIC.jpg','Full-colour printed drinkware gift box sleeves in a range of designs','/products/drinkware','See drinkware',ARRAY['category:drinkware']::text[]);