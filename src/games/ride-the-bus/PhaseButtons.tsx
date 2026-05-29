"use client";

import { motion } from "framer-motion";
import { type Suit } from "@/lib/deck";
import { NeonButton } from "@/components/ui";
import { cn } from "@/lib/cn";

export type Phase = "q1" | "q2" | "q3" | "q4" | "summary";

const SUIT_LABELS: { suit: Suit; label: string; color: string }[] = [
  { suit: "♠", label: "Spades ♠", color: "#9d4edd" },
  { suit: "♥", label: "Hearts ♥", color: "#ff2d95" },
  { suit: "♦", label: "Diamonds ♦", color: "#ff5e5b" },
  { suit: "♣", label: "Clubs ♣", color: "#2de2c0" },
];

export interface PhaseButtonsProps {
  phase: Phase;
  revealing: boolean;
  onGuessColor: (red: boolean) => void;
  onGuessHigher: (higher: boolean) => void;
  onGuessInside: (inside: boolean) => void;
  onGuessSuit: (suit: Suit) => void;
}

const groupVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 320, damping: 22 },
  },
};

// ── Q1: Red or Black ─────────────────────────────────────────────────────────
function Q1Buttons({
  revealing,
  onGuessColor,
}: Pick<PhaseButtonsProps, "revealing" | "onGuessColor">) {
  return (
    <motion.div className="flex gap-3" variants={groupVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <NeonButton
          onClick={() => onGuessColor(true)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          ♥ Red
        </NeonButton>
      </motion.div>
      <motion.div variants={itemVariants}>
        <NeonButton
          onClick={() => onGuessColor(false)}
          size="lg"
          variant="ghost"
          disabled={revealing}
        >
          ♠ Black
        </NeonButton>
      </motion.div>
    </motion.div>
  );
}

// ── Q2: Higher or Lower ───────────────────────────────────────────────────────
function Q2Buttons({
  revealing,
  onGuessHigher,
}: Pick<PhaseButtonsProps, "revealing" | "onGuessHigher">) {
  return (
    <motion.div className="flex gap-3" variants={groupVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <NeonButton
          onClick={() => onGuessHigher(true)}
          size="lg"
          variant="success"
          disabled={revealing}
        >
          ↑ Higher
        </NeonButton>
      </motion.div>
      <motion.div variants={itemVariants}>
        <NeonButton
          onClick={() => onGuessHigher(false)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          ↓ Lower
        </NeonButton>
      </motion.div>
    </motion.div>
  );
}

// ── Q3: Inside or Outside ────────────────────────────────────────────────────
function Q3Buttons({
  revealing,
  onGuessInside,
}: Pick<PhaseButtonsProps, "revealing" | "onGuessInside">) {
  return (
    <motion.div className="flex gap-3" variants={groupVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <NeonButton
          onClick={() => onGuessInside(true)}
          size="lg"
          variant="success"
          disabled={revealing}
        >
          ← Inside →
        </NeonButton>
      </motion.div>
      <motion.div variants={itemVariants}>
        <NeonButton
          onClick={() => onGuessInside(false)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          ↔ Outside
        </NeonButton>
      </motion.div>
    </motion.div>
  );
}

// ── Q4: Guess the Suit ───────────────────────────────────────────────────────
function Q4Buttons({
  revealing,
  onGuessSuit,
}: Pick<PhaseButtonsProps, "revealing" | "onGuessSuit">) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-2 w-full"
      variants={groupVariants}
      initial="hidden"
      animate="show"
    >
      {SUIT_LABELS.map(({ suit, label, color }) => (
        <motion.button
          key={suit}
          disabled={revealing}
          variants={itemVariants}
          whileHover={{ scale: revealing ? 1 : 1.04, y: revealing ? 0 : -2 }}
          whileTap={{ scale: revealing ? 1 : 0.96 }}
          onClick={() => onGuessSuit(suit)}
          className={cn(
            "glass rounded-2xl px-4 py-2.5 text-base font-semibold border border-white/10",
            "transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:border-white/30",
          )}
          style={{ color, boxShadow: `0 0 18px -8px ${color}` }}
        >
          {label}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function PhaseButtons({
  phase,
  revealing,
  onGuessColor,
  onGuessHigher,
  onGuessInside,
  onGuessSuit,
}: PhaseButtonsProps) {
  if (phase === "q1") return <Q1Buttons revealing={revealing} onGuessColor={onGuessColor} />;
  if (phase === "q2") return <Q2Buttons revealing={revealing} onGuessHigher={onGuessHigher} />;
  if (phase === "q3") return <Q3Buttons revealing={revealing} onGuessInside={onGuessInside} />;
  if (phase === "q4") return <Q4Buttons revealing={revealing} onGuessSuit={onGuessSuit} />;
  return null;
}
