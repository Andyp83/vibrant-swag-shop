import screenPrint from "@/assets/decoration/screen-print.jpg.asset.json";
import embroidery from "@/assets/decoration/embroidery.jpg.asset.json";
import padPrint from "@/assets/decoration/pad-print.jpg.asset.json";
import laserEngraving from "@/assets/decoration/laser-engraving.jpg.asset.json";
import digitalUvPrint from "@/assets/decoration/digital-uv-print.jpg.asset.json";
import debossing from "@/assets/decoration/debossing.jpg.asset.json";
import fullColourWrap from "@/assets/decoration/full-colour-wrap.jpg.asset.json";
import doming from "@/assets/decoration/doming.jpg.asset.json";

export const decorationImages: Record<string, { url: string; alt: string }> = {
  "screen-print": {
    url: screenPrint.url,
    alt: "Screen printing a single-colour logo onto a cotton t-shirt",
  },
  embroidery: {
    url: embroidery.url,
    alt: "Close-up of an embroidered logo stitched onto a navy cap",
  },
  "pad-print": {
    url: padPrint.url,
    alt: "Pad printed branding on a set of colourful promotional pens",
  },
  "laser-engraving": {
    url: laserEngraving.url,
    alt: "Laser engraved mark on a brushed stainless steel insulated bottle",
  },
  "digital-uv-print": {
    url: digitalUvPrint.url,
    alt: "Full-colour digital UV print on a white hardcover notebook",
  },
  debossing: {
    url: debossing.url,
    alt: "Debossed logo pressed into a tan PU leather notebook cover",
  },
  "full-colour-wrap": {
    url: fullColourWrap.url,
    alt: "Insulated tumbler with a seamless full-colour printed wrap",
  },
  doming: {
    url: doming.url,
    alt: "Glossy domed resin label on a branded keyring",
  },
};
