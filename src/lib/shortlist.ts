import { useCallback, useEffect, useState } from "react";

export type ShortlistItem = {
  /** Catalogue product id, or a stable synthetic key for non-product entries. */
  id: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  /** Decoration methods the item supports (used to offer favourites). */
  methods: string[];
  moq: string;
  /** The customer's favoured decoration method for this item. */
  decoration: string;
  quantity: string;
  notes: string;
  addedAt: number;
};

export type ShortlistInput = Omit<ShortlistItem, "decoration" | "quantity" | "notes" | "addedAt">;

const STORAGE_KEY = "ssb-shortlist-v1";
const EVENT = "ssb-shortlist-change";

function read(): ShortlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ShortlistItem =>
        Boolean(item) && typeof (item as ShortlistItem).id === "string",
    );
  } catch {
    return [];
  }
}

function write(items: ShortlistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function shortlistSummary(items: ShortlistItem[]) {
  return items
    .map((item, i) => {
      const bits = [
        `${i + 1}. ${item.name} (${item.categoryName})`,
        item.decoration ? `decoration: ${item.decoration}` : "decoration: recommend one",
        item.quantity ? `qty: ${item.quantity}` : null,
        item.notes ? `notes: ${item.notes}` : null,
      ].filter(Boolean);
      return bits.join(" — ");
    })
    .join("\n");
}

export function useShortlist() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const add = useCallback((input: ShortlistInput) => {
    const current = read();
    if (current.some((item) => item.id === input.id)) return;
    write([
      ...current,
      {
        ...input,
        decoration: input.methods.length === 1 ? (input.methods[0] as string) : "",
        quantity: "",
        notes: "",
        addedAt: Date.now(),
      },
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((item) => item.id !== id));
  }, []);

  const toggle = useCallback(
    (input: ShortlistInput) => {
      const current = read();
      if (current.some((item) => item.id === input.id)) {
        remove(input.id);
        return false;
      }
      add(input);
      return true;
    },
    [add, remove],
  );

  const update = useCallback((id: string, patch: Partial<ShortlistItem>) => {
    write(read().map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, hydrated, has, add, remove, toggle, update, clear };
}
