import archer from "@/assets/banners/Archer-Launch_LWB_1.jpg.asset.json";
import aura from "@/assets/banners/Aura_LWB.jpg.asset.json";
import digiflex from "@/assets/banners/Distributor-LWB.jpg.asset.json";
import prism from "@/assets/banners/Prism-Digital-Print_-SWB.jpg.asset.json";
import camaro from "@/assets/banners/Camaro_LWB_Unbranded.jpg.asset.json";
import impactAware from "@/assets/banners/Impact_Aware_LWB.jpg.asset.json";
import brandcraft from "@/assets/banners/Large_Web_Banner_-_BRANDCRAFT.jpg.asset.json";
import puff from "@/assets/banners/Puff_Print_LWB.jpg.asset.json";
import bodum from "@/assets/banners/SWB-Distributor.jpg.asset.json";
import kadi from "@/assets/banners/Small_Web_Banner_-_Kadi_AU_Only_1.jpg.asset.json";
import mcScreenPrint from "@/assets/banners/MC_Screen_Print_-_Large_Banner.jpg.asset.json";
import mcPadPrint from "@/assets/banners/Multi-Colour_Pad_Print_-_Large_Banner.jpg.asset.json";
import siliconeDigital from "@/assets/banners/Silicone_Digital_Print_-_Large_Banner.jpg.asset.json";
import thermoDebossing from "@/assets/banners/Thermo_Debossing_-_Mini_Banner.jpg.asset.json";
import colourflex from "@/assets/banners/1920x450px_Web_Banner_Colourflex_B.jpg.asset.json";
import camelbak from "@/assets/banners/CamelBak_-_Large_Web_Banner.jpg.asset.json";
import skullcandy from "@/assets/banners/1920x450px-SkullCandy_LWB.jpg.asset.json";
import lookbookLwb from "@/assets/banners/Brands_Lookbook_LWB.jpg.asset.json";
import lookbookSwb from "@/assets/banners/Brands_Lookbook_SWB.jpg.asset.json";
import keepsake from "@/assets/banners/Keepsake_SWB.jpg.asset.json";
import fullColourTowels from "@/assets/banners/1920x450px-Full-Colour-Towels_LWB.jpg.asset.json";
import customPackaging from "@/assets/banners/Custom_Packaging_LWB.jpg.asset.json";
import rotaryVarnish from "@/assets/banners/Rotary_Digital_Varnish_LWB_4.jpg.asset.json";
import alchemy from "@/assets/banners/Alchemy_New_Colours_LWB_3.jpg.asset.json";
import brandcraftSwb from "@/assets/banners/BrandCraft_SWB.jpg.asset.json";
import oceanBottle from "@/assets/banners/Ocean-Bottle_LWB.jpg.asset.json";
import foilPrinting from "@/assets/banners/Foil_Printing_LWB_2_Oct_2024_NB.jpg.asset.json";
import blindDebossing from "@/assets/banners/1920x450px-Thermo-and-Blind-Debossing_LWB.jpg.asset.json";
import boxSleeves from "@/assets/banners/1920x450px-Drinkware-Box-Sleeves_LWB_GENERIC.jpg.asset.json";

export type Banner = {
  url: string;
  alt: string;
  to?: string;
  cta?: string;
};

export const banners = {
  archer: {
    url: archer.url,
    alt: "Archer bag range launch banner — for life in motion",
    to: "/products/bags",
    cta: "See the bag range",
  },
  aura: {
    url: aura.url,
    alt: "Aura vacuum bottle range shown across a full rainbow of colourways",
    to: "/colour-guide",
    cta: "Browse the colour guide",
  },
  camaro: {
    url: camaro.url,
    alt: "Camaro vacuum bottle in sixteen colours, one signature shape",
    to: "/products/drinkware",
    cta: "See drinkware",
  },
  digiflex: {
    url: digiflex.url,
    alt: "DigiFlex Transfer — personalised full-colour designs on apparel and bags",
    to: "/decoration",
    cta: "Compare decoration methods",
  },
  prism: {
    url: prism.url,
    alt: "Prism Print — full colour, high-gloss branding for a lasting impact",
    to: "/decoration#prism-digital-print",
    cta: "About Prism Digital Print",
  },
  puff: {
    url: puff.url,
    alt: "Puff Print — raised texture printing on branded apparel",
    to: "/decoration#screen-print",
    cta: "About screen print",
  },
  impactAware: {
    url: impactAware.url,
    alt: "Impact Aware — designed with tomorrow in mind, recycled and natural materials",
  },
  brandcraft: {
    url: brandcraft.url,
    alt: "Brandcraft flat-pack cardboard model kits branded in full colour",
    to: "/products/promotional",
    cta: "See promotional items",
  },
  bodum: {
    url: bodum.url,
    alt: "Bodum glassware and coffee presses — for the perfect brew",
    to: "/products/drinkware",
    cta: "See drinkware",
  },
  kadi: {
    url: kadi.url,
    alt: "Kadi hard-shell luggage range with a debossed logo",
    to: "/products/bags",
    cta: "See the bag range",
  },
  mcScreenPrint: {
    url: mcScreenPrint.url,
    alt: "Multi-colour rotary screen printing on drink bottles with tight registration",
    to: "/decoration#screen-print",
    cta: "About screen print",
  },
  mcPadPrint: {
    url: mcPadPrint.url,
    alt: "Multi-colour pad printing on a silicone cup band, up to five colours",
    to: "/decoration#pad-print",
    cta: "About pad print",
  },
  siliconeDigital: {
    url: siliconeDigital.url,
    alt: "Silicone digital print — full-colour photographic branding on reusable cups",
    to: "/decoration#silicone-digital-print",
    cta: "About Silicone Digital Print",
  },
  thermoDebossing: {
    url: thermoDebossing.url,
    alt: "Thermo debossing pressing a logo into a soft-touch notebook cover",
    to: "/decoration#debossing",
    cta: "About debossing",
  },
  colourflex: {
    url: colourflex.url,
    alt: "Colourflex high-impact branding on bags, towels and hoodies",
    to: "/decoration#colourflex-transfer",
    cta: "About Colourflex transfer",
  },
  camelbak: {
    url: camelbak.url,
    alt: "CamelBak bottles and hydration packs — unleash your brand on every adventure",
    to: "/products/drinkware",
    cta: "See drinkware",
  },
  skullcandy: {
    url: skullcandy.url,
    alt: "Skullcandy headphones and earbuds — music you can feel",
    to: "/products/tech",
    cta: "See tech gifts",
  },
  lookbookLwb: {
    url: lookbookLwb.url,
    alt: "Brands Lookbook out now — branded bags, drinkware, audio and apparel",
    to: "/lookbook",
    cta: "Open the Brands Lookbook",
  },
  lookbookSwb: {
    url: lookbookSwb.url,
    alt: "Brands Lookbook out now, shown open across two spreads",
    to: "/lookbook",
    cta: "Open the Brands Lookbook",
  },
  keepsake: {
    url: keepsake.url,
    alt: "Keepsake Collection — premium wine and glassware gifting on a hillside table",
    to: "/products/promotional",
    cta: "See the Keepsake gifting range",
  },
  fullColourTowels: {
    url: fullColourTowels.url,
    alt: "Full-colour sublimation towels printed in-house for events and summer campaigns",
    to: "/decoration#sublimation-print",
    cta: "About Sublimation Print",
  },
  customPackaging: {
    url: customPackaging.url,
    alt: "Custom printed packaging — CMYK digital printed mailer boxes with no minimum order",
    to: "/products/packaging",
    cta: "See packaging",
  },
  rotaryVarnish: {
    url: rotaryVarnish.url,
    alt: "Rotary digital print on drinkware now with a stunning gloss varnish finish",
    to: "/decoration#rotary-digital-print",
    cta: "About Rotary Digital Print",
  },
  alchemy: {
    url: alchemy.url,
    alt: "All new Alchemy glass tumblers with bamboo lids in eight new silicone sleeve colours",
    to: "/products/drinkware",
    cta: "See drinkware",
  },
  brandcraftSwb: {
    url: brandcraftSwb.url,
    alt: "Brandcraft flat-pack cardboard vehicles and animals ready for full-colour branding",
    to: "/products/promotional",
    cta: "See promotional items",
  },
  oceanBottle: {
    url: oceanBottle.url,
    alt: "Ocean Bottle — planet-positive reusable bottles making refilling everyday behaviour",
    to: "/products/outdoor-leisure",
    cta: "See the eco range",
  },
  foilPrinting: {
    url: foilPrinting.url,
    alt: "Foil printing on notebooks in gold, copper and silver for a premium finish",
    to: "/decoration#debossing",
    cta: "About premium finishes",
  },
  blindDebossing: {
    url: blindDebossing.url,
    alt: "Thermo and blind debossing pressing logos into soft-touch notebook covers",
    to: "/decoration#debossing",
    cta: "About debossing",
  },
  boxSleeves: {
    url: boxSleeves.url,
    alt: "Full-colour printed drinkware gift box sleeves in a range of designs",
    to: "/products/drinkware",
    cta: "See drinkware",
  },
} satisfies Record<string, Banner>;


/** Banners shown on each category page, keyed by category slug. */
export const categoryBanners: Record<string, Banner[]> = {
  drinkware: [
    banners.aura,
    banners.camaro,
    banners.alchemy,
    banners.camelbak,
    banners.bodum,
    banners.boxSleeves,
  ],
  bags: [banners.archer, banners.kadi],
  apparel: [banners.puff, banners.colourflex, banners.digiflex, banners.fullColourTowels],
  tech: [banners.skullcandy],
  promotional: [banners.keepsake, banners.brandcraft, banners.brandcraftSwb],
  "outdoor-leisure": [banners.impactAware, banners.oceanBottle],
  packaging: [banners.customPackaging, banners.foilPrinting, banners.blindDebossing],
};

/** Decoration-method promo banners shown on the decoration page. */
export const decorationBanners: Banner[] = [
  banners.mcScreenPrint,
  banners.mcPadPrint,
  banners.siliconeDigital,
  banners.rotaryVarnish,
  banners.colourflex,
  banners.fullColourTowels,
  banners.foilPrinting,
  banners.blindDebossing,
  banners.thermoDebossing,
  banners.digiflex,
  banners.puff,
  banners.prism,
];

