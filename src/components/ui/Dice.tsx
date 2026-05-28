"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const SIZES = { sm: "w-12 h-12", md: "w-16 h-16", lg: "w-24 h-24" } as const;

export interface DieProps {
  value: number;
  rolling?: boolean;
  size?: keyof typeof SIZES;
  color?: string;
  className?: string;
}

/** A single pip die with a tumble animation while rolling. */
export function Die({ value, rolling = false, size = "md", color = "#ff2d95", className }: DieProps) {
  const v = Math.min(6, Math.max(1, value));
  return (
    <motion.div
      animate={
        rolling
          ? { rotate: [0, -90, 120, -200, 360], scale: [1, 1.1, 0.95, 1.05, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={rolling ? { duration: 0.6, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 18 }}
      className={cn(
        "relative grid grid-cols-3 grid-rows-3 gap-0.5 p-2 rounded-2xl bg-white",
        SIZES[size],
        className,
      )}
      style={{ boxShadow: `0 0 24px -6px ${color}, inset 0 -4px 10px -4px rgba(0,0,0,0.25)` }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const on = PIPS[v].some(([r, c]) => r === row && c === col);
        return (
          <span key={i} className="flex items-center justify-center">
            {on && (
              <span
                className="rounded-full"
                style={{
                  width: "62%",
                  height: "62%",
                  background: "radial-gradient(circle at 35% 30%, #444, #0a0a0a)",
                }}
              />
            )}
          </span>
        );
      })}
    </motion.div>
  );
}
