"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Beer } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Player } from "@/store/players";

/** Small rounded label/value chip. */
export function Chip({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 text-xs text-white/80", className)}
      style={color ? { boxShadow: `inset 0 0 0 1px ${color}55` } : undefined}
    >
      {children}
    </span>
  );
}

/** Centered section heading with an accent. */
export function GameHeading({ title, subtitle, accent = "#ff2d95" }: { title: string; subtitle?: string; accent?: string }) {
  return (
    <div className="text-center mb-6">
      <h2 className="font-display text-2xl sm:text-3xl text-white neon-text" style={{ color: accent }}>
        {title}
      </h2>
      {subtitle && <p className="text-white/50 mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

/** Animated "drink!" callout for big moments. */
export function DrinkCallout({ text = "Drink!", accent = "#ffb627" }: { text?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 16 }}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-display uppercase tracking-wider"
      style={{ color: "#1a0a00", background: accent, boxShadow: `0 0 36px -6px ${accent}` }}
    >
      <Beer size={20} /> {text}
    </motion.div>
  );
}

/** A pill representing a player, colored by their accent. */
export function PlayerChip({ player, active, className }: { player: Player; active?: boolean; className?: string }) {
  return (
    <motion.span
      layout
      animate={active ? { scale: 1.06 } : { scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
        active ? "text-white" : "text-white/70 glass",
        className,
      )}
      style={active ? { background: player.color, boxShadow: `0 0 24px -4px ${player.color}` } : undefined}
    >
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: active ? "#fff" : player.color }} />
      {player.name}
    </motion.span>
  );
}
