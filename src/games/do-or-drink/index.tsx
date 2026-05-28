"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { RotateCcw, Zap } from "lucide-react";
import {
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import { usePlayers, type Player } from "@/store/players";
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
      <motion.span
        key={value}
        initial={{ scale: 1.4, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-display text-3xl font-bold"
        style={{ color }}
      >
        {value}
      </motion.span>
      <span className="text-xs text-white/40 uppercase tracking-widest">{label}</span>
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
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <GameHeading
        title="Do or Drink"
        subtitle="Flip a dare — DO it or DRINK instead. No judgment (mostly)."
        accent={ACCENT}
      />

      {/* Player turn strip */}
      {hasTurns && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {players.map((p, i) => (
            <PlayerChip
              key={p.id}
              player={p}
              active={i === state.turnIndex % players.length}
            />
          ))}
        </div>
      )}

      {/* Dare card */}
      <div className="w-full min-h-[200px] mb-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="glass rounded-3xl w-full p-8 flex flex-col items-center gap-3 cursor-pointer select-none"
              style={{ boxShadow: `0 0 40px -16px ${ACCENT}` }}
              onClick={dealNext}
            >
              <Zap size={40} style={{ color: ACCENT }} />
              <p className="text-white/50 text-sm">
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
              initial={{ opacity: 0, y: 24, rotateX: -12 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -24, rotateX: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="glass-strong rounded-3xl w-full p-8"
              style={{ boxShadow: `0 0 52px -14px ${ACCENT}` }}
            >
              {/* Player label inside card */}
              {hasTurns && currentPlayer && (
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: currentPlayer.color }}>
                  {currentPlayer.name}&apos;s dare
                </p>
              )}

              <p
                className={cn(
                  "font-display text-xl sm:text-2xl leading-snug",
                  phase === "did" ? "text-white/40 line-through" : "text-white",
                )}
              >
                {dare}
              </p>

              {/* Outcome badge */}
              <div className="mt-5 min-h-[3rem] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === "did" && (
                    <motion.p
                      key="did"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
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
      <div className="flex items-center gap-10 mt-8 glass rounded-2xl px-8 py-4">
        <TallyPip value={daresDone} label="Dares done" color="#b6ff3c" />
        <div className="w-px h-10 bg-white/10" />
        <TallyPip value={drinksTaken} label="Drinks taken" color={ACCENT} />
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset game
      </button>
    </div>
  );
}

// ─── Default export — wraps with RequirePlayers or runs solo ─────────────────

export default function DoOrDrink() {
  const players = usePlayers((s) => s.players);

  // If players are already configured, go straight to the game.
  // RequirePlayers is used to enforce a minimum only when no players exist
  // yet — but this game can also run solo / without names.
  if (players.length >= 2) {
    return <DoOrDrinkGame players={players} />;
  }

  // With 0-1 players: offer RequirePlayers prompt OR let them play solo.
  return (
    <div className="flex flex-col items-center gap-6">
      <RequirePlayers min={2} accent={ACCENT}>
        {(ps) => <DoOrDrinkGame players={ps} />}
      </RequirePlayers>
    </div>
  );
}
