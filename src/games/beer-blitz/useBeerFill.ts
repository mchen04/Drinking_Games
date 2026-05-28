"use client";

import { useCallback, useEffect, useRef } from "react";

export type Phase = "idle" | "filling" | "result-hit" | "result-miss" | "overflow" | "gameover";

interface UseBeerFillOptions {
  /** fill % per second */
  speed: number;
  onFillChange: (pct: number) => void;
  onOverflow: () => void;
}

interface UseBeerFillReturn {
  /** Start the fill loop from 0. */
  startFill: () => void;
  /** Cancel the running RAF without side-effects (caller handles state). */
  cancelFill: () => void;
  /** Read the current authoritative fill value (0-100). */
  getFill: () => number;
}

/**
 * Drives a requestAnimationFrame fill loop.
 * - Calls `onFillChange` each frame with the new fill % (0-100).
 * - Calls `onOverflow` when fill reaches 100 and stops the loop.
 * - RAF is cancelled on unmount automatically.
 */
export function useBeerFill({
  speed,
  onFillChange,
  onOverflow,
}: UseBeerFillOptions): UseBeerFillReturn {
  const rafId = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const fillRef = useRef(0);
  // Keep speed readable inside the closure without re-creating `startFill`.
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const cancelFill = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const startFill = useCallback(() => {
    // Cancel any running loop before starting fresh.
    cancelFill();

    fillRef.current = 0;
    lastTs.current = null;
    onFillChange(0);

    function frame(ts: number) {
      if (lastTs.current === null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;

      fillRef.current = Math.min(100, fillRef.current + speedRef.current * dt);
      onFillChange(fillRef.current);

      if (fillRef.current >= 100) {
        rafId.current = null;
        onOverflow();
        return;
      }

      rafId.current = requestAnimationFrame(frame);
    }

    rafId.current = requestAnimationFrame(frame);
  }, [cancelFill, onFillChange, onOverflow]);

  // Cancel on unmount.
  useEffect(() => {
    return () => {
      cancelFill();
    };
  }, [cancelFill]);

  const getFill = useCallback(() => fillRef.current, []);

  return { startFill, cancelFill, getFill };
}
