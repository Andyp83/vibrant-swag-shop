export type SpectrumColor =
  | "red"
  | "orange"
  | "amber"
  | "lime"
  | "green"
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "magenta"
  | "pink";

export const swatchClass: Record<SpectrumColor, string> = {
  red: "bg-spectrum-red",
  orange: "bg-spectrum-orange",
  amber: "bg-spectrum-amber",
  lime: "bg-spectrum-lime",
  green: "bg-spectrum-green",
  teal: "bg-spectrum-teal",
  cyan: "bg-spectrum-cyan",
  blue: "bg-spectrum-blue",
  indigo: "bg-spectrum-indigo",
  violet: "bg-spectrum-violet",
  magenta: "bg-spectrum-magenta",
  pink: "bg-spectrum-pink",
};

export const textClass: Record<SpectrumColor, string> = {
  red: "text-spectrum-red",
  orange: "text-spectrum-orange",
  amber: "text-spectrum-amber",
  lime: "text-spectrum-lime",
  green: "text-spectrum-green",
  teal: "text-spectrum-teal",
  cyan: "text-spectrum-cyan",
  blue: "text-spectrum-blue",
  indigo: "text-spectrum-indigo",
  violet: "text-spectrum-violet",
  magenta: "text-spectrum-magenta",
  pink: "text-spectrum-pink",
};

export type Product = {
  name: string;
  blurb: string;
  colours: string;
  minimum: string;
  methods: string[];
};

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  colour: SpectrumColor;
  image: string;
  products: Product[];
};

export const categories: Category[] = [
  {
    slug: "drinkware",
    name: "Drinkware",
    tagline: "Bottles, tumblers, mugs",
    description:
      "The category people actually keep. Vacuum bottles, ceramic mugs and reusable cups in a full spectrum of powder-coat colours.",
    colour: "red",
    image: drinkware.url,
    products: [
      {
        name: "Compadre Vacuum Bottle 750ml",
        blurb: "Double-walled stainless steel with a flip-straw lid and carry loop.",
        colours: "17 powder-coat colours",
        minimum: "MOQ 25",
        methods: ["Laser engraving", "Digital UV print", "Full-colour wrap"],
      },
      {
        name: "Everyday Ceramic Mug 350ml",
        blurb: "Chunky matte ceramic with a colour-matched interior.",
        colours: "9 colours",
        minimum: "MOQ 36",
        methods: ["Pad print", "Digital UV print"],
      },
      {
        name: "Commuter Travel Tumbler 450ml",
        blurb: "Leak-proof sipper lid, fits a standard cup holder.",
        colours: "8 colours",
        minimum: "MOQ 50",
        methods: ["Laser engraving", "Pad print"],
      },
      {
        name: "Recycled rPET Sports Bottle 800ml",
        blurb: "Tritan-clear body made from post-consumer plastic.",
        colours: "6 tints + clear",
        minimum: "MOQ 100",
        methods: ["Screen print", "Full-colour wrap"],
      },
      {
        name: "Barista Glass Cup 380ml",
        blurb: "Borosilicate glass with a silicone grip band.",
        colours: "7 band colours",
        minimum: "MOQ 48",
        methods: ["Digital UV print", "Doming"],
      },
      {
        name: "Can Cooler & Stubby Holder",
        blurb: "Insulated stainless can holder for 375ml cans.",
        colours: "12 colours",
        minimum: "MOQ 50",
        methods: ["Laser engraving", "Full-colour wrap"],
      },
    ],
  },
  {
    slug: "apparel",
    name: "Apparel",
    tagline: "Tees, hoodies, polos",
    description:
      "Uniform-grade blanks that survive a hundred washes, decorated with print or stitch depending on the look you want.",
    colour: "orange",
    image: apparel.url,
    products: [
      {
        name: "Heavyweight Cotton Tee",
        blurb: "220gsm combed cotton, unisex fit, side-seamed.",
        colours: "24 colours",
        minimum: "MOQ 20",
        methods: ["Screen print", "Embroidery", "Digital UV print"],
      },
      {
        name: "Brushed Fleece Hoodie",
        blurb: "320gsm fleece with a double-lined hood and kangaroo pocket.",
        colours: "14 colours",
        minimum: "MOQ 20",
        methods: ["Screen print", "Embroidery"],
      },
      {
        name: "Performance Polo",
        blurb: "Moisture-wicking pique with a soft-touch collar.",
        colours: "16 colours",
        minimum: "MOQ 24",
        methods: ["Embroidery", "Screen print"],
      },
      {
        name: "Hi-Vis Safety Vest",
        blurb: "Day/night compliant with reflective taping.",
        colours: "Yellow, orange",
        minimum: "MOQ 25",
        methods: ["Screen print"],
      },
      {
        name: "Softshell Jacket",
        blurb: "Water-resistant three-layer shell with zip pockets.",
        colours: "8 colours",
        minimum: "MOQ 15",
        methods: ["Embroidery"],
      },
      {
        name: "Crew Sweatshirt",
        blurb: "Classic loopback crew with ribbed cuffs.",
        colours: "12 colours",
        minimum: "MOQ 20",
        methods: ["Screen print", "Embroidery"],
      },
    ],
  },
  {
    slug: "bags",
    name: "Bags & Totes",
    tagline: "Totes, backpacks, coolers",
    description:
      "Big print areas and long shelf lives. The most cost-effective way to put your brand out on the street.",
    colour: "amber",
    image: bags.url,
    products: [
      {
        name: "Heavy Canvas Tote",
        blurb: "12oz cotton canvas with reinforced long handles.",
        colours: "10 colours + natural",
        minimum: "MOQ 50",
        methods: ["Screen print", "Embroidery"],
      },
      {
        name: "Everyday Laptop Backpack",
        blurb: "Padded 15\" sleeve, luggage passthrough, water bottle pocket.",
        colours: "6 colours",
        minimum: "MOQ 25",
        methods: ["Embroidery", "Debossing"],
      },
      {
        name: "Drawstring Sport Pack",
        blurb: "Lightweight cinch bag, ideal for events and giveaways.",
        colours: "12 colours",
        minimum: "MOQ 100",
        methods: ["Screen print", "Full-colour wrap"],
      },
      {
        name: "Insulated Cooler Bag 12L",
        blurb: "Leak-resistant lining, holds 18 cans plus ice.",
        colours: "7 colours",
        minimum: "MOQ 50",
        methods: ["Screen print", "Embroidery"],
      },
      {
        name: "Recycled Kraft Gift Bag",
        blurb: "Rope-handled paper bag for onboarding kits.",
        colours: "5 colours",
        minimum: "MOQ 100",
        methods: ["Screen print", "Digital UV print"],
      },
      {
        name: "Weekender Duffle",
        blurb: "600D poly duffle with a separate shoe compartment.",
        colours: "5 colours",
        minimum: "MOQ 25",
        methods: ["Embroidery", "Screen print"],
      },
    ],
  },
  {
    slug: "tech",
    name: "Tech & Power",
    tagline: "Chargers, speakers, drives",
    description:
      "High-perceived-value gifts for client thank-yous and executive kits. Compliance certificates supplied with every order.",
    colour: "blue",
    image: tech.url,
    products: [
      {
        name: "10,000mAh Power Bank",
        blurb: "USB-C in/out, LED charge indicator, pass-through charging.",
        colours: "6 colours",
        minimum: "MOQ 25",
        methods: ["Laser engraving", "Digital UV print"],
      },
      {
        name: "Wireless Charging Pad",
        blurb: "15W fast charge with a soft-touch finish and huge print area.",
        colours: "4 colours",
        minimum: "MOQ 50",
        methods: ["Digital UV print", "Doming"],
      },
      {
        name: "Pocket Bluetooth Speaker",
        blurb: "Fabric-wrapped, 8 hour playback, IPX5 splash resistant.",
        colours: "5 colours",
        minimum: "MOQ 25",
        methods: ["Pad print", "Digital UV print"],
      },
      {
        name: "Twist USB Drive 32GB",
        blurb: "Metal swivel casing, data preloading available.",
        colours: "10 colours",
        minimum: "MOQ 50",
        methods: ["Laser engraving", "Pad print"],
      },
      {
        name: "Braided 3-in-1 Cable",
        blurb: "USB-C, Lightning and micro-USB in one nylon cable.",
        colours: "6 colours",
        minimum: "MOQ 100",
        methods: ["Pad print", "Doming"],
      },
      {
        name: "True Wireless Earbuds",
        blurb: "Touch controls with a charging case that carries your mark.",
        colours: "3 colours",
        minimum: "MOQ 25",
        methods: ["Digital UV print", "Laser engraving"],
      },
    ],
  },
  {
    slug: "stationery",
    name: "Stationery",
    tagline: "Notebooks, pens, desk",
    description:
      "Conference and onboarding staples. Notebooks bind in your brand colour; pens can be built from colour-matched components.",
    colour: "lime",
    image: stationery.url,
    products: [
      {
        name: "Hardcover A5 Notebook",
        blurb: "Elastic closure, ribbon marker, 160 lined pages.",
        colours: "11 cover colours",
        minimum: "MOQ 50",
        methods: ["Debossing", "Screen print", "Digital UV print"],
      },
      {
        name: "Cork-Bound Notebook",
        blurb: "Natural cork cover with recycled paper stock.",
        colours: "Natural + 3 trims",
        minimum: "MOQ 100",
        methods: ["Laser engraving", "Screen print"],
      },
      {
        name: "Mix-and-Match Click Pen",
        blurb: "Choose barrel, grip and clip colours independently.",
        colours: "14 component colours",
        minimum: "MOQ 250",
        methods: ["Pad print"],
      },
      {
        name: "Aluminium Rollerball",
        blurb: "Weighted metal body with a satin anodised finish.",
        colours: "8 colours",
        minimum: "MOQ 100",
        methods: ["Laser engraving"],
      },
      {
        name: "Sticky Note Wallet",
        blurb: "Card wallet with flags and a 50-sheet pad.",
        colours: "6 colours",
        minimum: "MOQ 250",
        methods: ["Digital UV print"],
      },
      {
        name: "Desk Mat & Mouse Pad",
        blurb: "Stitched-edge felt or PU mat, edge-to-edge printing.",
        colours: "5 colours",
        minimum: "MOQ 100",
        methods: ["Full-colour wrap", "Digital UV print"],
      },
    ],
  },
  {
    slug: "eco",
    name: "Eco & Sustainable",
    tagline: "Recycled, bamboo, cork",
    description:
      "Lower-impact alternatives across every category, with material certificates so your sustainability claims stand up.",
    colour: "green",
    image: eco.url,
    products: [
      {
        name: "Bamboo Cutlery Set",
        blurb: "Fork, knife, spoon and chopsticks in a cotton roll.",
        colours: "4 pouch colours",
        minimum: "MOQ 100",
        methods: ["Laser engraving", "Screen print"],
      },
      {
        name: "Recycled Cotton Tote",
        blurb: "Made from 80% post-industrial recycled cotton.",
        colours: "5 colours",
        minimum: "MOQ 100",
        methods: ["Screen print"],
      },
      {
        name: "Wheat Straw Lunch Box",
        blurb: "Bio-composite container with a bamboo lid and cutlery.",
        colours: "5 colours",
        minimum: "MOQ 100",
        methods: ["Pad print", "Digital UV print"],
      },
      {
        name: "Seed Paper Card",
        blurb: "Plantable card stock embedded with wildflower seed.",
        colours: "3 stocks",
        minimum: "MOQ 250",
        methods: ["Digital UV print"],
      },
      {
        name: "Recycled Ocean Plastic Bottle",
        blurb: "rPET body traced to coastal collection programs.",
        colours: "6 colours",
        minimum: "MOQ 100",
        methods: ["Screen print", "Full-colour wrap"],
      },
      {
        name: "Cork Desk Organiser",
        blurb: "Solid cork tray for cables, cards and keys.",
        colours: "Natural",
        minimum: "MOQ 50",
        methods: ["Laser engraving"],
      },
    ],
  },
  {
    slug: "headwear",
    name: "Headwear",
    tagline: "Caps, beanies, bucket hats",
    description:
      "Embroidery country. Six-panel caps, cuffed beanies and bucket hats with colour-matched stitching.",
    colour: "teal",
    image: headwear.url,
    products: [
      {
        name: "Six-Panel Structured Cap",
        blurb: "Cotton twill crown with a pre-curved peak and metal buckle.",
        colours: "18 colours",
        minimum: "MOQ 25",
        methods: ["Embroidery", "Screen print"],
      },
      {
        name: "Trucker Cap",
        blurb: "Foam front panel with a breathable mesh back.",
        colours: "12 combos",
        minimum: "MOQ 25",
        methods: ["Embroidery", "Doming"],
      },
      {
        name: "Cuffed Acrylic Beanie",
        blurb: "Fine-knit beanie with a fold cuff for badge placement.",
        colours: "15 colours",
        minimum: "MOQ 25",
        methods: ["Embroidery", "Woven badge"],
      },
      {
        name: "Bucket Hat",
        blurb: "Soft cotton brim hat, festival and summer campaign favourite.",
        colours: "8 colours",
        minimum: "MOQ 50",
        methods: ["Embroidery", "Screen print"],
      },
      {
        name: "Five-Panel Flat Peak",
        blurb: "Skate-style crown with a flat snapback closure.",
        colours: "10 colours",
        minimum: "MOQ 50",
        methods: ["Embroidery"],
      },
      {
        name: "Performance Running Cap",
        blurb: "Lightweight technical fabric with reflective trim.",
        colours: "6 colours",
        minimum: "MOQ 50",
        methods: ["Embroidery", "Screen print"],
      },
    ],
  },
  {
    slug: "gift-sets",
    name: "Gift Sets",
    tagline: "Onboarding & client kits",
    description:
      "Curated boxes assembled, wrapped and drop-shipped to individual addresses. Choose the contents, we handle the rest.",
    colour: "magenta",
    image: giftsets.url,
    products: [
      {
        name: "New Starter Welcome Box",
        blurb: "Bottle, notebook, pen and tee in a printed rigid box.",
        colours: "Box in any brand colour",
        minimum: "MOQ 25",
        methods: ["Digital UV print", "Screen print", "Embroidery"],
      },
      {
        name: "Client Thank-You Kit",
        blurb: "Premium drinkware, chocolate and a handwritten card.",
        colours: "6 box colours",
        minimum: "MOQ 25",
        methods: ["Debossing", "Laser engraving"],
      },
      {
        name: "Conference Delegate Pack",
        blurb: "Tote, notebook, pen and lanyard, packed per delegate.",
        colours: "Mix and match",
        minimum: "MOQ 100",
        methods: ["Screen print", "Digital UV print"],
      },
      {
        name: "Work-From-Home Bundle",
        blurb: "Desk mat, mug, charging pad and cable tidy.",
        colours: "4 palettes",
        minimum: "MOQ 25",
        methods: ["Digital UV print", "Laser engraving"],
      },
      {
        name: "Milestone Award Set",
        blurb: "Engraved keepsake plus a personalised certificate.",
        colours: "3 finishes",
        minimum: "MOQ 10",
        methods: ["Laser engraving"],
      },
      {
        name: "Eco Starter Kit",
        blurb: "Bamboo cutlery, rPET bottle and recycled notebook.",
        colours: "Natural + green",
        minimum: "MOQ 50",
        methods: ["Laser engraving", "Screen print"],
      },
    ],
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export type Decoration = {
  slug: string;
  name: string;
  colour: SpectrumColor;
  what: string;
  bestFor: string;
  colourLimit: string;
  leadTime: string;
  artwork: string;
};

export const decorations: Decoration[] = [
  {
    slug: "screen-print",
    name: "Screen Print",
    colour: "red",
    what: "Ink pushed through a fine mesh screen, one screen per colour. The workhorse for apparel and bags.",
    bestFor: "Tees, hoodies, totes, drawstring bags, large flat areas",
    colourLimit: "1–6 spot colours, matched to Pantone",
    leadTime: "8–10 working days",
    artwork: "Vector (AI, EPS, PDF) with colours separated and text converted to outlines.",
  },
  {
    slug: "embroidery",
    name: "Embroidery",
    colour: "orange",
    what: "Your logo stitched directly into the fabric with coloured thread. Premium, textured and effectively permanent.",
    bestFor: "Caps, beanies, polos, jackets, backpacks",
    colourLimit: "Up to 12 thread colours, matched to Madeira",
    leadTime: "10–12 working days (plus one-off digitising)",
    artwork: "Vector preferred. Fine detail under 2mm and thin type will not hold a stitch.",
  },
  {
    slug: "pad-print",
    name: "Pad Print",
    colour: "amber",
    what: "A silicone pad lifts ink from an etched plate and lays it onto curved or uneven surfaces.",
    bestFor: "Pens, USB drives, small tech, mugs, uneven shapes",
    colourLimit: "1–4 spot colours",
    leadTime: "7–9 working days",
    artwork: "Vector, single colour per plate, minimum line weight 0.3mm.",
  },
  {
    slug: "laser-engraving",
    name: "Laser Engraving",
    colour: "green",
    what: "A laser removes the surface coating to reveal the material underneath. No ink, nothing to wear off.",
    bestFor: "Stainless drinkware, metal pens, bamboo, cork, leather",
    colourLimit: "Single tone — the natural colour of the substrate",
    leadTime: "7–9 working days",
    artwork: "Vector or high-contrast black and white. Gradients cannot be reproduced.",
  },
  {
    slug: "digital-uv-print",
    name: "Digital UV Print",
    colour: "cyan",
    what: "Full-colour inkjet cured instantly with UV light, printed straight onto the product.",
    bestFor: "Notebooks, drinkware, chargers, boxes, photographic artwork",
    colourLimit: "Unlimited CMYK, plus white underbase on dark products",
    leadTime: "6–8 working days",
    artwork: "300dpi raster (PNG, TIFF, PDF) or vector, in CMYK.",
  },
  {
    slug: "debossing",
    name: "Debossing",
    colour: "indigo",
    what: "A heated brass die presses your mark into the material, leaving a clean recessed impression.",
    bestFor: "PU and leather notebooks, cases, tags, journals",
    colourLimit: "Blind (no colour) or foiled in gold, silver or a spot colour",
    leadTime: "10–12 working days",
    artwork: "Bold vector shapes. Very fine strokes fill in under pressure.",
  },
  {
    slug: "full-colour-wrap",
    name: "Full-Colour Wrap",
    colour: "violet",
    what: "A printed film wrapped around the whole product for edge-to-edge, seam-free coverage.",
    bestFor: "Bottles, tumblers, can coolers, desk mats, all-over artwork",
    colourLimit: "Unlimited CMYK with photographic detail",
    leadTime: "9–11 working days",
    artwork: "Supplied to our wrap template at 300dpi with 3mm bleed.",
  },
  {
    slug: "doming",
    name: "Doming",
    colour: "magenta",
    what: "A printed label finished with a clear polyurethane dome that magnifies the artwork and shrugs off scratches.",
    bestFor: "Cables, keyrings, trucker caps, chargers, badges",
    colourLimit: "Unlimited CMYK plus metallic bases",
    leadTime: "9–11 working days",
    artwork: "Vector or 300dpi raster with a defined outer cut shape.",
  },
];

export const artworkFaq = [
  {
    q: "What file format should I send?",
    a: "Vector artwork (AI, EPS or PDF) is ideal because it scales to any size without losing quality. If you only have a raster file, send the largest version you have at 300dpi — ideally a PNG with a transparent background.",
  },
  {
    q: "I only have a logo from our website. Is that enough?",
    a: "Often not. Web logos are usually 72dpi and too small to print cleanly. Send it through anyway — our studio will tell you honestly whether it will hold up, and can redraw it as vector for a one-off fee.",
  },
  {
    q: "How do you match our brand colours?",
    a: "Send your Pantone references and we match spot-colour methods to them exactly. Full-colour methods are converted to the closest CMYK build, and we can supply a pre-production sample if the colour is critical.",
  },
  {
    q: "Will I see a proof before production?",
    a: "Always. Every order gets a digital proof showing placement, size and colours, and nothing goes to production until you approve it in writing.",
  },
  {
    q: "Can you print onto dark products?",
    a: "Yes. Screen and digital methods can lay down a white underbase first so colours stay bright instead of sinking into the garment or bottle.",
  },
];
