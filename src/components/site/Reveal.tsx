import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  /** Motion flavour. */
  variant?: "up" | "left" | "right" | "scale" | "blur";
  className?: string;
  as?: ElementType;
};

const variantClass: Record<NonNullable<RevealProps["variant"]>, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
  blur: "reveal-blur",
};

/** Reveals its children on first scroll into view. Respects reduced motion. */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref}
      className={`${variantClass[variant]} ${shown ? "is-revealed" : ""} ${className}`}
      style={{ transitionDelay: reduced ? undefined : `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
