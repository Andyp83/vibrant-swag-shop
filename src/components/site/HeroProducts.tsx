import bottleRed from "@/assets/hero/bottle-red-cut.png.asset.json";
import spinnerOrange from "@/assets/hero/spinner-orange-cut.png.asset.json";
import capYellow from "@/assets/hero/cap-yellow-cut.png.asset.json";
import notebookLime from "@/assets/hero/notebook-lime-cut.png.asset.json";
import torchGreen from "@/assets/hero/torch-green-cut.png.asset.json";
import giftboxTeal from "@/assets/hero/giftbox-teal-cut.png.asset.json";
import thongsBlue from "@/assets/hero/thongs-blue-cut.png.asset.json";
import winebagsViolet from "@/assets/hero/winebags-violet-cut.png.asset.json";
import lipbalmMagenta from "@/assets/hero/lipbalm-magenta-cut.png.asset.json";
import cardholderPink from "@/assets/hero/cardholder-pink-cut.png.asset.json";

type Item = {
  src: string;
  alt: string;
  /** tailwind position + size classes */
  pos: string;
  rotate: string;
  glow: string;
  delay: number;
  duration: string;
};

const items: Item[] = [
  {
    src: bottleRed.url,
    alt: "Red branded vacuum insulated drink bottle",
    pos: "top-[8%] left-[16%] w-[22%]",
    rotate: "-12deg",
    glow: "drop-shadow-[0_18px_40px_rgba(244,63,94,0.45)]",
    delay: 0,
    duration: "7.5s",
  },
  {
    src: spinnerOrange.url,
    alt: "Orange branded fidget spinner",
    pos: "top-[2%] right-[20%] w-[17%]",
    rotate: "10deg",
    glow: "drop-shadow-[0_18px_40px_rgba(249,115,22,0.45)]",
    delay: 320,
    duration: "8.5s",
  },
  {
    src: capYellow.url,
    alt: "Yellow branded baseball cap",
    pos: "top-[30%] right-[1%] w-[24%]",
    rotate: "16deg",
    glow: "drop-shadow-[0_18px_40px_rgba(250,204,21,0.45)]",
    delay: 520,
    duration: "9s",
  },
  {
    src: notebookLime.url,
    alt: "Lime green branded notebook",
    pos: "bottom-[36%] right-[-2%] w-[23%]",
    rotate: "-6deg",
    glow: "drop-shadow-[0_18px_40px_rgba(163,230,53,0.45)]",
    delay: 700,
    duration: "7.8s",
  },
  {
    src: torchGreen.url,
    alt: "Green branded metal torch",
    pos: "bottom-[6%] right-[14%] w-[20%]",
    rotate: "-38deg",
    glow: "drop-shadow-[0_18px_40px_rgba(34,197,94,0.45)]",
    delay: 880,
    duration: "8.2s",
  },
  {
    src: thongsBlue.url,
    alt: "Blue branded thongs",
    pos: "bottom-[2%] left-[42%] w-[20%]",
    rotate: "14deg",
    glow: "drop-shadow-[0_18px_40px_rgba(59,130,246,0.45)]",
    delay: 1040,
    duration: "9.4s",
  },
  {
    src: giftboxTeal.url,
    alt: "Teal branded gift box with bottle and tumbler",
    pos: "top-[58%] left-[19%] w-[26%]",
    rotate: "4deg",
    glow: "drop-shadow-[0_18px_40px_rgba(45,212,191,0.45)]",
    delay: 1200,
    duration: "8.8s",
  },
  {
    src: winebagsViolet.url,
    alt: "Branded paper wine bags with violet handles",
    pos: "top-[22%] left-[43%] w-[22%]",
    rotate: "5deg",
    glow: "drop-shadow-[0_18px_40px_rgba(139,92,246,0.45)]",
    delay: 1360,
    duration: "7.2s",
  },
  {
    src: lipbalmMagenta.url,
    alt: "Magenta branded lip balm tube",
    pos: "top-[43%] left-[2%] w-[12%]",
    rotate: "-22deg",
    glow: "drop-shadow-[0_18px_40px_rgba(217,70,239,0.45)]",
    delay: 1520,
    duration: "6.8s",
  },
  {
    src: cardholderPink.url,
    alt: "Pink branded silicone card holder",
    pos: "bottom-[18%] left-[6%] w-[22%]",
    rotate: "-10deg",
    glow: "drop-shadow-[0_18px_40px_rgba(244,114,182,0.45)]",
    delay: 1680,
    duration: "8s",
  },
];

export function HeroProducts() {
  return (
    <div className="relative isolate mx-auto aspect-square w-full max-w-[38rem]">
      {/* Chromatic radiance backdrop */}
      <div
        className="spectrum-rays spectrum-rays-spin absolute inset-[-14%] -z-10 opacity-45 blur-[70px]"
        aria-hidden="true"
      />

      <div className="relative size-full">
        {items.map((item) => (
          <div
            key={item.src}
            className={`hero-rise absolute ${item.pos}`}
            style={{ animationDelay: `${item.delay}ms` }}
          >
            <div className="float-slow" style={{ animationDuration: item.duration }}>
              <img
                src={item.src}
                alt={item.alt}
                loading="eager"
                className={`size-full object-contain saturate-[1.15] ${item.glow}`}
                style={{ transform: `rotate(${item.rotate})` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
