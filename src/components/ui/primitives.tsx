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

/** Centered section heading with an accent. Compact by design so it never
 *  fights the shell header for vertical space. */
export function GameHeading({ title, subtitle, accent = "#ff2d95" }: { title: string; subtitle?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-4 sm:mb-5"
    >
      <h2 className="font-display text-xl sm:text-2xl text-white neon-text leading-tight" style={{ color: accent }}>
        {title}
      </h2>
      {subtitle && <p className="text-white/50 mt-1 text-sm">{subtitle}</p>}
    </motion.div>
  );
}

/** Animated "drink!" callout for big moments — springs in, then breathes a glow. */
export function DrinkCallout({ text = "Drink!", accent = "#ffb627" }: { text?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 14 }}
      className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-display uppercase tracking-wider text-lg"
      style={{ color: "#1a0a00", background: accent }}
    >
      <motion.span
        animate={{ rotate: [0, -12, 12, -8, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1.4 }}
        className="inline-flex"
      >
        <Beer size={22} />
      </motion.span>
      <motion.span
        className="absolute inset-0 rounded-2xl -z-10"
        animate={{ boxShadow: [`0 0 24px -6px ${accent}`, `0 0 52px 2px ${accent}`, `0 0 24px -6px ${accent}`] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: accent }}
      />
      {text}
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
