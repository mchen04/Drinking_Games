"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { RotateCcw, Zap } from "lucide-react";
import {
  NeonButton,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import { type Player } from "@/store/players";
import { createDealer } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { DARES } from "./data";

const ACCENT = "#ff2d95";

// ─── Tallies display ────────────────────────────────────────────────────────

function TallyPip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ scale: 1.6, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0, y: -4 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className="font-display text-2xl sm:text-3xl font-bold leading-none"
          style={{ color, textShadow: `0 0 16px ${color}66` }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Core game ──────────────────────────────────────────────────────────────

type Phase = "idle" | "dare" | "did" | "drink";

interface GameState {
  dare: string;
  phase: Phase;
  daresDone: number;
  drinksTaken: number;
  turnIndex: number;
}

function DoOrDrinkGame({ players }: { players: Player[] }) {
  const dealerRef = useRef(createDealer(DARES));

  const [state, setState] = useState<GameState>({
    dare: "",
    phase: "idle",
    daresDone: 0,
    drinksTaken: 0,
    turnIndex: 0,
  });

  const hasTurns = players.length > 0;
  const currentPlayer = hasTurns ? players[state.turnIndex % players.length] : null;

  function dealNext() {
    sfx.whoosh();
    const dare = dealerRef.current.next();
    setState((s) => ({ ...s, dare, phase: "dare" }));
  }

  function handleDidIt() {
    sfx.win();
    pop(0.5, 0.45);
    setState((s) => ({
      ...s,
      phase: "did",
      daresDone: s.daresDone + 1,
    }));
  }

  function handleDrink() {
    sfx.buzz();
    drinkRain();
    setState((s) => ({
      ...s,
      phase: "drink",
      drinksTaken: s.drinksTaken + 1,
    }));
  }

  function handleNext() {
    sfx.click();
    setState((s) => ({
      ...s,
      phase: "idle",
      dare: "",
      turnIndex: hasTurns ? s.turnIndex + 1 : s.turnIndex,
    }));
  }

  function handleReset() {
    dealerRef.current = createDealer(DARES);
    setState({
      dare: "",
      phase: "idle",
      daresDone: 0,
      drinksTaken: 0,
      turnIndex: 0,
    });
  }

  const { phase, dare, daresDone, drinksTaken } = state;

  return (
    <motion.div
      className="flex flex-col items-center w-full max-w-lg mx-auto px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-white/50 text-sm text-center mb-3">
        Flip a dare — DO it or DRINK instead. No judgment (mostly).
      </p>

      {/* Player turn strip */}
      {hasTurns && (
        <motion.div layout className="flex flex-wrap justify-center gap-2 mb-3">
          <AnimatePresence initial={false}>
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
              >
                <PlayerChip
                  player={p}
                  active={i === state.turnIndex % players.length}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dare card */}
      <div className="relative w-full min-h-[9rem] sm:min-h-[11rem] mb-3 sm:mb-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="glass rounded-3xl w-full p-5 sm:p-6 flex flex-col items-center gap-2 cursor-pointer select-none"
              style={{ boxShadow: `0 0 40px -16px ${ACCENT}` }}
              onClick={dealNext}
            >
              <motion.div
                animate={{ y: [0, -4, 0], rotate: [-4, 4, -4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: `drop-shadow(0 0 14px ${ACCENT})` }}
              >
                <Zap size={38} style={{ color: ACCENT }} />
              </motion.div>
              <p className="text-white/50 text-sm text-center">
                {hasTurns && currentPlayer ? (
                  <>
                    <span style={{ color: currentPlayer.color }} className="font-semibold">
                      {currentPlayer.name}
                    </span>
                    &apos;s turn — tap to flip a dare
                  </>
                ) : (
                  "Tap to flip a dare"
                )}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={dare}
              initial={{ opacity: 0, y: 24, rotateX: -14, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                rotateX: 0,
                scale: 1,
                x: phase === "drink" ? [0, -10, 10, -6, 6, 0] : 0,
              }}
              exit={{ opacity: 0, y: -24, rotateX: 12, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 22,
                x: { duration: 0.4, ease: "easeInOut" },
              }}
              className="glass-strong rounded-3xl w-full p-5 sm:p-6"
              style={{
                boxShadow: `0 0 52px -14px ${ACCENT}`,
                transformPerspective: 900,
              }}
            >
              {/* Player label inside card */}
              {hasTurns && currentPlayer && (
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: currentPlayer.color }}>
                  {currentPlayer.name}&apos;s dare
                </p>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.3 }}
                className={cn(
                  "font-display text-lg sm:text-2xl leading-snug",
                  phase === "did" ? "text-white/40 line-through" : "text-white",
                )}
              >
                {dare}
              </motion.p>

              {/* Outcome badge */}
              <div className="mt-3 sm:mt-4 min-h-[2.5rem] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === "did" && (
                    <motion.p
                      key="did"
                      initial={{ opacity: 0, scale: 0.5, y: 8 }}
                      animate={{ opacity: 1, scale: [0.5, 1.15, 1], y: 0 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", stiffness: 340, damping: 14 }}
                      className="font-display text-lg uppercase tracking-wider"
                      style={{ color: "#b6ff3c", textShadow: `0 0 18px #b6ff3c` }}
                    >
                      Legend. 😎
                    </motion.p>
                  )}
                  {phase === "drink" && (
                    <motion.div key="drink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <DrinkCallout
                        text={
                          hasTurns && currentPlayer
                            ? `${currentPlayer.name}, drink!`
                            : "Drink up! 🍺"
                        }
                        accent={ACCENT}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <AnimatePresence mode="wait">
          {phase === "idle" ? (
            <motion.div
              key="flip-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <NeonButton
                onClick={dealNext}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Flip a dare ⚡
              </NeonButton>
            </motion.div>
          ) : phase === "dare" ? (
            <motion.div
              key="dare-btns"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <NeonButton
                onClick={handleDidIt}
                variant="success"
                size="lg"
                className="flex-1"
              >
                Did it 😎
              </NeonButton>
              <NeonButton
                onClick={handleDrink}
                variant="danger"
                size="lg"
                className="flex-1"
              >
                Drink instead 🍺
              </NeonButton>
            </motion.div>
          ) : (
            <motion.div
              key="next-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <NeonButton
                onClick={handleNext}
                variant="ghost"
                size="lg"
                className="w-full"
              >
                Next dare →
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tallies */}
      <div className="flex items-center gap-6 sm:gap-10 mt-4 glass rounded-2xl px-6 sm:px-8 py-3">
        <TallyPip value={daresDone} label="Dares done" color="#b6ff3c" />
        <div className="w-px h-8 bg-white/10" />
        <TallyPip value={drinksTaken} label="Drinks taken" color={ACCENT} />
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset game
      </button>
    </motion.div>
  );
}

// ─── Default export — gate on 2+ players (registry: "2+") ────────────────────

export default function DoOrDrink() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <DoOrDrinkGame players={players} />}
    </RequirePlayers>
  );
}
