import type { ReactNode } from "react";

/** Infinite horizontal ticker. Duplicates content for a seamless loop. */
export function Marquee({
  items,
  speed = 38,
  reverse = false,
  className = "",
  separator = "◆",
}: {
  items: ReactNode[];
  /** Seconds per full loop. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  separator?: string;
}) {
  const track = (
    <ul className="marquee-track flex shrink-0 items-center gap-10 pr-10">
      {items.map((item, i) => (
        <li key={i} className="flex shrink-0 items-center gap-10 whitespace-nowrap">
          <span>{item}</span>
          <span aria-hidden="true" className="opacity-40">
            {separator}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={`marquee group relative flex overflow-hidden ${className}`}
      style={{
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        ["--marquee-duration" as string]: `${speed}s`,
        ["--marquee-direction" as string]: reverse ? "reverse" : "normal",
      }}
    >
      {track}
      <div aria-hidden="true" className="contents">
        {track}
      </div>
    </div>
  );
}
