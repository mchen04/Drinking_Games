"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Wheel,
  RequirePlayers,
  DrinkCallout,
  type WheelSegment,
} from "@/components/ui";
import { sfx } from "@/lib/sound";
import { celebrate, drinkRain } from "@/lib/confetti";
import type { Player } from "@/store/players";
import { DARE_SEGMENTS, type DareSegment } from "./data";

const ACCENT = "#ffb627";

export default function WheelOfMisfortune() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

function Game({ players }: { players: Player[] }) {
  const [result, setResult] = useState<DareSegment | null>(null);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  const currentPlayer = players[currentPlayerIdx % players.length];

  const segments: WheelSegment[] = DARE_SEGMENTS.map((d) => ({
    label: d.label,
    color: d.color,
  }));

  function handleResult(index: number) {
    const dare = DARE_SEGMENTS[index];
    setResult(dare);

    if (dare.kind === "safe") {
      celebrate();
      sfx.ding();
    } else if (dare.kind === "drink") {
      drinkRain();
      sfx.pour();
    } else {
      sfx.win();
    }
  }

  function nextTurn() {
    sfx.click();
    setResult(null);
    setCurrentPlayerIdx((i) => i + 1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="relative flex flex-col items-center"
    >
      <p className="text-white/50 text-sm text-center mb-2 landscape:hidden">
        Spin the wheel to see your fate.
      </p>

      {/* dynamic turn indicator — counts the active spinner, not the game title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPlayer.id}
          initial={{ opacity: 0, y: -6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="flex items-center gap-2 mb-3 px-4 py-1.5 glass rounded-full text-sm"
        >
          <motion.span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: currentPlayer.color }}
            animate={{ boxShadow: [`0 0 0 0 ${currentPlayer.color}66`, `0 0 0 6px ${currentPlayer.color}00`] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="text-white/80">
            Spinning:{" "}
            <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
          </span>
        </motion.div>
      </AnimatePresence>

      <div className="origin-top scale-[0.82] sm:scale-100 landscape:scale-[0.6] sm:landscape:scale-90">
        <Wheel
          segments={segments}
          size={300}
          onSpinStart={() => setResult(null)}
          onResult={(index) => handleResult(index)}
        />
      </div>

      {/* result card — overlaid so it never reserves vertical space */}
      <AnimatePresence>
        {result && (
          <motion.div
            key={result.label}
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-sm glass-strong rounded-3xl p-5 text-center"
            style={{ boxShadow: `0 0 48px -12px ${result.color}` }}
          >
            <motion.h3
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 340, damping: 16 }}
              className="font-display text-2xl mb-2 neon-text"
              style={{ color: result.color }}
            >
              {result.label}
            </motion.h3>

            <p className="text-white/75 text-sm leading-snug mb-3">
              {result.detail}
            </p>

            {result.kind === "drink" && (
              <div className="flex justify-center mb-3">
                <DrinkCallout
                  text={`${currentPlayer.name}, drink!`}
                  accent={result.color}
                />
              </div>
            )}

            {result.kind === "safe" && (
              <motion.p
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 14 }}
                className="font-display text-xl mb-3"
                style={{ color: "#b6ff3c" }}
              >
                You&apos;re safe! 🎉
              </motion.p>
            )}

            {result.kind === "wild" && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-lg mb-3 text-white/90"
              >
                ⚡ Wild card!
              </motion.p>
            )}

            {/* roster — highlights whose turn it is */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-3">
              {players.map((p, i) => (
                <motion.span
                  layout
                  key={p.id}
                  className="text-xs px-2.5 py-1 rounded-full glass"
                  animate={{ opacity: i === currentPlayerIdx % players.length ? 1 : 0.5 }}
                  style={{
                    color: p.color,
                    boxShadow:
                      i === currentPlayerIdx % players.length
                        ? `0 0 12px -2px ${p.color}`
                        : undefined,
                  }}
                >
                  {p.name}
                </motion.span>
              ))}
            </div>

            <motion.button
              onClick={nextTurn}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 mx-auto text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              <RotateCcw size={13} /> next player
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
