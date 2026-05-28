"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Managed setTimeout: schedule timers that auto-cancel on unmount, plus a
 * clearAll() to cancel any in-flight timers before starting a new sequence.
 * Replaces hand-rolled timer refs + cleanup across the game components.
 */
export function useTimeouts() {
  const ids = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);

  const clearAll = useCallback(() => {
    ids.current.forEach(clearTimeout);
    ids.current.clear();
  }, []);

  useEffect(
    () => () => {
      ids.current.forEach(clearTimeout);
      ids.current.clear();
    },
    [],
  );

  return { after, clearAll };
}
