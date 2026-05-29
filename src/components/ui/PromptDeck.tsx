"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { createDealer } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { NeonButton } from "./NeonButton";
import { cn } from "@/lib/cn";

export interface PromptDeckProps {
  items: readonly string[];
  accent?: string;
  /** small label above the prompt, e.g. "Never have I ever…" */
  prefix?: string;
  nextLabel?: string;
  /** called whenever a new prompt is dealt */
  onNext?: (item: string) => void;
  className?: string;
  /** extra controls rendered under the Next button */
  footer?: ReactNode;
}

/**
 * Swipeable, non-repeating prompt deck. Drag or tap Next to deal the next card.
 * Used by most prompt-based party games.
 */
export function PromptDeck({
  items,
  accent = "#ff2d95",
  prefix,
  nextLabel = "Next",
  onNext,
  className,
  footer,
}: PromptDeckProps) {
  const dealer = useMemo(() => createDealer(items), [items]);
  const [current, setCurrent] = useState<string>(() => dealer.next());
  const [count, setCount] = useState(1);
  const key = useRef(0);

  const deal = useCallback(() => {
    sfx.flip();
    const item = dealer.next();
    key.current += 1;
    setCurrent(item);
    setCount((c) => c + 1);
    onNext?.(item);
  }, [dealer, onNext]);

  return (
    <div className={cn("w-full max-w-xl mx-auto flex flex-col items-center", className)}>
      <div
        className="relative w-full mb-6 h-[clamp(11rem,42vh,20rem)]"
        style={{ perspective: 1200 }}
      >
        {/* stacked ghost cards for depth */}
        <div
          aria-hidden
          className="absolute inset-x-4 top-3 bottom-0 glass rounded-[2rem] opacity-40"
          style={{ transform: "translateY(14px) scale(0.93)" }}
        />
        <div
          aria-hidden
          className="absolute inset-x-2 top-1.5 bottom-0 glass rounded-[2rem] opacity-60"
          style={{ transform: "translateY(7px) scale(0.965)" }}
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={key.current}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            whileDrag={{ scale: 1.02, cursor: "grabbing" }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 500) deal();
            }}
            initial={{ opacity: 0, scale: 0.8, rotateY: 45, y: 36 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, x: -300, rotate: -14 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="absolute inset-0 glass-strong rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing overflow-hidden"
            style={{ boxShadow: `0 0 60px -18px ${accent}, inset 0 0 0 1px rgba(255,255,255,0.08)` }}
          >
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={{ x: "-130%", skewX: "-18deg", opacity: 0.5 }}
              animate={{ x: "230%", opacity: 0.5 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              style={{
                background:
                  "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.18) 48%, transparent 66%)",
              }}
            />
            {prefix && (
              <span
                className="font-display uppercase tracking-[0.25em] text-xs mb-4 sm:mb-5"
                style={{ color: accent }}
              >
                {prefix}
              </span>
            )}
            <p className="text-xl sm:text-3xl font-semibold leading-snug text-balance text-white">
              {current}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <NeonButton onClick={deal} size="lg" className="min-w-44">
        {nextLabel}
      </NeonButton>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
        <RotateCcw size={12} />
        <span>{count} dealt · swipe or tap</span>
      </div>

      {footer}
    </div>
  );
}
