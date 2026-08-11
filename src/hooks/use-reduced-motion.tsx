import { useCallback, useSyncExternalStore } from "react";

export type MotionMode = "auto" | "reduced" | "full";

const STORAGE_KEY = "bb-motion-mode";
const listeners = new Set<() => void>();

let mode: MotionMode = "auto";
let systemReduced = false;
let initialised = false;

function isMode(value: string | null): value is MotionMode {
  return value === "auto" || value === "reduced" || value === "full";
}

function emit() {
  for (const listener of listeners) listener();
}

/** Reflects the effective preference on <html> so CSS can gate every animation. */
function syncDocument() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset["motion"] = effectiveReduced() ? "reduced" : "full";
}

function effectiveReduced() {
  if (mode === "reduced") return true;
  if (mode === "full") return false;
  return systemReduced;
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isMode(stored)) mode = stored;

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  systemReduced = mq.matches;
  mq.addEventListener("change", (event) => {
    systemReduced = event.matches;
    syncDocument();
    emit();
  });

  syncDocument();
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setMode(next: MotionMode) {
  mode = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage can be unavailable (private mode) — preference stays in memory
    }
  }
  syncDocument();
  emit();
}

/**
 * Motion preference shared by every animated component.
 * `reduced` is false during SSR/first paint so markup stays stable; the
 * `prefers-reduced-motion` media query still suppresses CSS motion immediately.
 */
export function useMotionPreference() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => `${mode}|${effectiveReduced()}`,
    () => "auto|false",
  );
  const [storedMode, reduced] = snapshot.split("|");

  const toggle = useCallback(() => {
    setMode(effectiveReduced() ? "full" : "reduced");
  }, []);

  return {
    mode: storedMode as MotionMode,
    reduced: reduced === "true",
    setMode,
    toggle,
  };
}

/** Convenience read for components that only need the boolean. */
export function useReducedMotion() {
  return useMotionPreference().reduced;
}
