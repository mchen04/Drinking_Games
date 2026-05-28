"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Wheel,
  RequirePlayers,
  GameHeading,
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
    <div className="flex flex-col items-center">
      <GameHeading
        title="Wheel of Misfortune"
        subtitle={`${currentPlayer.name}'s turn — spin to see your fate.`}
        accent={ACCENT}
      />

      <div className="flex items-center gap-2 mb-4 px-4 py-2 glass rounded-full text-sm">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: currentPlayer.color }} />
        <span className="text-white/80">
          Spinning:{" "}
          <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
        </span>
      </div>

      <Wheel
        segments={segments}
        size={300}
        onResult={(index) => handleResult(index)}
      />

      <div className="w-full max-w-sm mt-6 min-h-[10rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={result.label}
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -12 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="glass-strong rounded-3xl p-6 w-full text-center"
              style={{ boxShadow: `0 0 48px -12px ${result.color}` }}
            >
              <h3
                className="font-display text-2xl mb-3 neon-text"
                style={{ color: result.color }}
              >
                {result.label}
              </h3>

              <p className="text-white/75 leading-relaxed mb-5">
                {result.detail}
              </p>

              {result.kind === "drink" && (
                <div className="flex justify-center mb-5">
                  <DrinkCallout
                    text={`${currentPlayer.name}, drink!`}
                    accent={result.color}
                  />
                </div>
              )}

              {result.kind === "safe" && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="font-display text-2xl mb-4"
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
                  className="font-display text-xl mb-4 text-white/90"
                >
                  ⚡ Wild card!
                </motion.p>
              )}

              <button
                onClick={nextTurn}
                className="mt-1 flex items-center gap-1.5 mx-auto text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                <RotateCcw size={13} /> next player
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/40 text-sm"
            >
              Hit <span style={{ color: ACCENT }}>Spin</span> to tempt fate.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {result && (
        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-sm">
          {players.map((p, i) => (
            <span
              key={p.id}
              className="text-xs px-2.5 py-1 rounded-full glass"
              style={{
                color: p.color,
                boxShadow:
                  i === currentPlayerIdx % players.length
                    ? `0 0 12px -2px ${p.color}`
                    : undefined,
                opacity: i === currentPlayerIdx % players.length ? 1 : 0.5,
              }}
            >
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
