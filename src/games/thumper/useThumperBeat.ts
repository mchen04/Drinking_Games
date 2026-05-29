"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAnimationControls } from "framer-motion";
import { sfx } from "@/lib/sound";

/** Fraction of the beat interval that counts as "on beat". */
const TOLERANCE_FRACTION = 0.28;

type Phase = "idle" | "playing" | "result";

interface UseThumperBeatOptions {
  phase: Phase;
  bpm: number;
  onMiss: () => void;
}

interface UseThumperBeatReturn {
  /** Call on every metronome tick to animate the orb. */
  pulseControls: ReturnType<typeof useAnimationControls>;
  /**
   * Judge a tap attempt. Returns "hit" if within tolerance, "miss" otherwise.
   * Returns null if the tap cannot be judged (wrong phase, window already used, no beat yet).
   */
  judgeTap: () => "hit" | "miss" | null;
}

export function useThumperBeat({
  phase,
  bpm,
  onMiss,
}: UseThumperBeatOptions): UseThumperBeatReturn {
  const lastBeatRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tapProcessedRef = useRef(false);
  const onMissRef = useRef(onMiss);
  useEffect(() => { onMissRef.current = onMiss; }, [onMiss]);

  const pulseControls = useAnimationControls();

  const fireBeat = useCallback(() => {
    lastBeatRef.current = performance.now();
    tapProcessedRef.current = false;
    sfx.tick();
    void pulseControls.start({
      scale: [1, 1.22, 1],
      opacity: [0.9, 1, 0.9],
      transition: { duration: 0.18, ease: "easeOut" },
    });
  }, [pulseControls]);

  // Start / stop metronome based on phase
  useEffect(() => {
    if (phase !== "playing") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Guard: clear any existing interval before starting a new one so a
    // rapid double-Start (or React strict-mode double-invoke) cannot spawn
    // two independent loops with out-of-sync lastBeatRef/tapProcessedRef.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const intervalMs = Math.round((60 / bpm) * 1000);
    // Fire immediately so first beat is instant
    fireBeat();
    intervalRef.current = setInterval(fireBeat, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, bpm, fireBeat]);

  // Miss-detection: if no tap arrives within ~85% of a beat, count it as a miss
  useEffect(() => {
    if (phase !== "playing") return;

    const intervalMs = Math.round((60 / bpm) * 1000);
    const missCheckTimer = setInterval(() => {
      if (
        lastBeatRef.current !== null &&
        !tapProcessedRef.current
      ) {
        const age = performance.now() - lastBeatRef.current;
        if (age > intervalMs * 0.85) {
          tapProcessedRef.current = true;
          onMissRef.current();
        }
      }
    }, Math.round(intervalMs * 0.9));

    return () => clearInterval(missCheckTimer);
  }, [phase, bpm]);

  const judgeTap = useCallback((): "hit" | "miss" | null => {
    if (phase !== "playing") return null;
    if (tapProcessedRef.current) return null; // already judged this window
    if (lastBeatRef.current === null) return null;

    const now = performance.now();
    const intervalMs = (60 / bpm) * 1000;
    const tolerance = intervalMs * TOLERANCE_FRACTION;
    const sinceBeat = now - lastBeatRef.current;

    tapProcessedRef.current = true;
    return sinceBeat <= tolerance ? "hit" : "miss";
  }, [phase, bpm]);

  return { pulseControls, judgeTap };
}
