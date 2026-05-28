"use client";

import { motion } from "framer-motion";
import { type Card, isRed } from "@/lib/deck";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: "w-16 h-24 text-base rounded-lg",
  md: "w-24 h-36 text-2xl rounded-xl",
  lg: "w-36 h-52 text-4xl rounded-2xl",
} as const;

const ROUNDED = { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl" } as const;

export interface PlayingCardProps {
  card?: Card | null;
  faceDown?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
  onClick?: () => void;
  /** highlight ring color */
  glow?: string;
}

/** A single playing card with a 3D flip between face-down and face-up. */
export function PlayingCard({
  card,
  faceDown = false,
  size = "md",
  className,
  onClick,
  glow,
}: PlayingCardProps) {
  const showBack = faceDown || !card;
  const red = card ? isRed(card.suit) : false;

  return (
    <div className={cn("relative", SIZES[size], className)} style={{ perspective: 1000 }}>
      <motion.div
        onClick={onClick}
        animate={{ rotateY: showBack ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={cn("relative w-full h-full", onClick && "cursor-pointer")}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Face */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between p-2 bg-white",
            ROUNDED[size],
          )}
          style={{
            backfaceVisibility: "hidden",
            boxShadow: glow ? `0 0 28px -6px ${glow}` : "0 8px 24px -10px rgba(0,0,0,0.7)",
          }}
        >
          {card && (
            <>
              <span className={cn("font-bold leading-none", red ? "text-rose-600" : "text-zinc-900")}>
                {card.rank}
                <span className="block text-[0.6em]">{card.suit}</span>
              </span>
              <span
                className={cn(
                  "self-center font-bold leading-none",
                  size === "lg" ? "text-6xl" : size === "md" ? "text-4xl" : "text-2xl",
                  red ? "text-rose-600" : "text-zinc-900",
                )}
              >
                {card.suit}
              </span>
              <span
                className={cn(
                  "self-end rotate-180 font-bold leading-none",
                  red ? "text-rose-600" : "text-zinc-900",
                )}
              >
                {card.rank}
                <span className="block text-[0.6em]">{card.suit}</span>
              </span>
            </>
          )}
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center overflow-hidden",
            ROUNDED[size],
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background:
              "repeating-linear-gradient(45deg, #2b0f4d 0 8px, #1a0833 8px 16px)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.15), 0 8px 24px -10px rgba(0,0,0,0.7)",
          }}
        >
          <span className="font-display text-neon-pink/80 neon-text text-xl">🍸</span>
        </div>
      </motion.div>
    </div>
  );
}
