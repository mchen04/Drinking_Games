"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { randInt } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/cn";

export interface WheelSegment {
  label: string;
  color: string;
}

export interface WheelProps {
  segments: WheelSegment[];
  onResult?: (index: number, segment: WheelSegment) => void;
  /** fired the moment a spin begins — clear any stale result UI here */
  onSpinStart?: () => void;
  size?: number;
  className?: string;
}

/**
 * A spinning prize wheel. Renders a conic-gradient disc with rotated labels and
 * a fixed top pointer; lands precisely on a random segment and fires onResult.
 */
export function Wheel({ segments, onResult, onSpinStart, size = 320, className }: WheelProps) {
  const controls = useAnimationControls();
  const rotation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const n = segments.length;
  const seg = 360 / n;

  const gradient = `conic-gradient(${segments
    .map((s, i) => `${s.color} ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(", ")})`;

  async function spin() {
    if (busy || n === 0) return;
    setBusy(true);
    setWinner(null);
    onSpinStart?.();
    sfx.whoosh();

    const target = randInt(0, n - 1);
    const turns = randInt(5, 8);
    // land the pointer (top, 0deg) on the centre of `target`
    const landing = 360 - (target * seg + seg / 2);
    const next = rotation.current + turns * 360 + (landing - (rotation.current % 360) + 360) % 360;
    rotation.current = next;

    await controls.start({
      rotate: next,
      transition: { duration: 4.2, ease: [0.16, 1, 0.3, 1] },
    });

    if (!mounted.current) return; // unmounted mid-spin — don't touch state
    setWinner(target);
    sfx.ding();
    onResult?.(target, segments[target]);
    setBusy(false);
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* pointer */}
        <div
          className="absolute left-1/2 -top-2 z-20 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: "26px solid #fff",
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7))",
          }}
        />
        <motion.div
          animate={controls}
          className="relative rounded-full"
          style={{
            width: size,
            height: size,
            background: gradient,
            boxShadow: "0 0 60px -10px rgba(255,45,149,0.5), inset 0 0 0 6px rgba(255,255,255,0.08)",
          }}
        >
          {segments.map((s, i) => {
            const angle = i * seg + seg / 2;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-left text-xs sm:text-sm font-semibold text-white drop-shadow"
                style={{
                  transform: `rotate(${angle}deg) translateX(${size * 0.16}px)`,
                  maxWidth: size * 0.32,
                }}
              >
                <span className="inline-block whitespace-nowrap">{s.label}</span>
              </div>
            );
          })}
          {/* hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-strong flex items-center justify-center text-lg">
            🍸
          </div>
        </motion.div>
      </div>

      <motion.button
        onClick={spin}
        disabled={busy}
        whileTap={{ scale: 0.95 }}
        className="mt-8 px-8 py-3 rounded-2xl font-display uppercase tracking-widest text-white bg-gradient-to-br from-neon-pink to-neon-violet shadow-[0_0_30px_-6px_#ff2d95] disabled:opacity-50"
      >
        {busy ? "Spinning…" : "Spin"}
      </motion.button>

      {winner !== null && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-lg text-white"
        >
          → <span className="font-bold" style={{ color: segments[winner].color }}>{segments[winner].label}</span>
        </motion.p>
      )}
    </div>
  );
}
