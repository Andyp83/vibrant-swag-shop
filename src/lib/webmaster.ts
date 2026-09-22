import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "./catalog.functions";

const STORAGE_KEY = "ssb-webmaster-manage";
const EVENT = "ssb-webmaster-change";

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "on";
}

/** True when the visitor is signed in as an admin (webmaster). */
export function useIsWebmaster() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data } = useQuery({
    queryKey: ["webmaster", "is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: hasSession,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return Boolean(data?.isAdmin);
}

/**
 * Manage mode: while it's on, the webmaster sees a small X on catalogue items
 * and taxonomy tiles as they browse the live site.
 */
export function useManageMode(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(read());
    const sync = () => setEnabled(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((next: boolean) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      window.dispatchEvent(new Event(EVENT));
    }
    setEnabled(next);
  }, []);

  return [enabled, set];
}
