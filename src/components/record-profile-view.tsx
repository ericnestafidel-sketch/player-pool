"use client";

import { useEffect, useRef } from "react";
import { recordProfileView } from "@/app/(private)/coach/search/actions";

/** Logs a profile view after the page is open in the browser, not during prefetch. */
export function RecordProfileView({ playerId }: { playerId: string }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void recordProfileView(playerId);
  }, [playerId]);
  return null;
}
