import screenPrint from "@/assets/decoration/screen-print.jpg.asset.json";
import embroidery from "@/assets/decoration/embroidery.png.asset.json";
import padPrint from "@/assets/decoration/pad-print.jpg.asset.json";
import laserEngraving from "@/assets/decoration/laser-engraving.jpg.asset.json";
import digitalUvPrint from "@/assets/decoration/digital-uv-print.jpg.asset.json";
import debossing from "@/assets/decoration/debossing-notebook.png.asset.json";
import fullColourWrap from "@/assets/decoration/full-colour-wrap.jpg.asset.json";
import doming from "@/assets/decoration/doming.jpg.asset.json";
import colourflexTransfer from "@/assets/decoration/colourflex-transfer.png.asset.json";
import digiflexTransfer from "@/assets/decoration/digiflex-transfer.png.asset.json";
import digitalPackagingPrint from "@/assets/decoration/digital-packaging-print.png.asset.json";
import digitalPrint from "@/assets/decoration/digital-print.png.asset.json";
import directDigital from "@/assets/decoration/direct-digital.png.asset.json";
import fauxEmbroidery from "@/assets/decoration/faux-embroidery.png.asset.json";

export const decorationImages: Record<string, { url: string; alt: string }> = {
  "screen-print": {
    url: screenPrint.url,
    alt: "Screen printing a single-colour logo onto a cotton t-shirt",
  },
  embroidery: {
    url: embroidery.url,
    alt: "Grey beanie with an embroidered EXPRESS logo in black and cyan thread",
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
    alt: "Blind debossed Warada logo on a marble-patterned notebook cover",
  },
  "full-colour-wrap": {
    url: fullColourWrap.url,
    alt: "Insulated tumbler with a seamless full-colour printed wrap",
  },
  doming: {
    url: doming.url,
    alt: "Glossy domed resin label on a branded keyring",
  },
  "colourflex-transfer": {
    url: colourflexTransfer.url,
    alt: "Navy hoodie branded with a full-colour Colourflex transfer print",
  },
  "digiflex-transfer": {
    url: digiflexTransfer.url,
    alt: "Black sweatshirt branded with a colourful DigiFlex transfer print",
  },
  "digital-packaging-print": {
    url: digitalPackagingPrint.url,
    alt: "Teal digitally printed packaging box with Fresh Bread branding pattern",
  },
  "digital-print": {
    url: digitalPrint.url,
    alt: "Teal digitally printed badge with colourful Join Now branding",
  },
  "direct-digital": {
    url: directDigital.url,
    alt: "Green glass coasters branded with full-colour direct digital print",
  },
  "faux-embroidery": {
    url: fauxEmbroidery.url,
    alt: "Black cap with a colourful Tropical Summer faux-embroidery style badge",
  },
};
