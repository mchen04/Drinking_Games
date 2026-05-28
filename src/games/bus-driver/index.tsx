"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Bus } from "lucide-react";
import { createDeck, type Card, type Rank } from "@/lib/deck";
import { PlayingCard, NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { celebrate } from "@/lib/confetti";
import { sfx } from "@/lib/sound";

const ACCENT = "#18e7ff";
const ROW_SIZE = 8;

/** Number of drinks for each face card rank. */
const FACE_DRINKS: Partial<Record<Rank, number>> = {
  J: 1,
  Q: 2,
  K: 3,
  A: 4,
};

function isFaceCard(rank: Rank): boolean {
  return rank in FACE_DRINKS;
}

type CardState = "hidden" | "safe" | "face";

interface SlotState {
  card: Card | null;
  state: CardState;
}

function buildHiddenRow(): SlotState[] {
  return Array.from({ length: ROW_SIZE }, () => ({ card: null, state: "hidden" as CardState }));
}

function buildDeck(): Card[] {
  return createDeck(true);
}

export default function BusDriver() {
  const [deck, setDeck] = useState<Card[]>(buildDeck);
  const [row, setRow] = useState<SlotState[]>(buildHiddenRow);
  const [flipped, setFlipped] = useState(0); // index of next card to flip (0-7)
  const [phase, setPhase] = useState<"playing" | "penalty" | "won">("playing");
  const [penaltyDrinks, setPenaltyDrinks] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timers on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (winTimerRef.current !== null) clearTimeout(winTimerRef.current);
    };
  }, []);

  /** Reset the row and reshuffle the deck, incrementing attempt count. */
  const resetRun = useCallback((nextAttempts: number) => {
    setRow(buildHiddenRow());
    setDeck(buildDeck());
    setFlipped(0);
    setAttempts(nextAttempts);
    setPhase("playing");
    setPenaltyDrinks(0);
    setBusy(false);
  }, []);

  function flipNext() {
    if (busy || phase !== "playing" || flipped >= ROW_SIZE) return;
    setBusy(true);
    sfx.flip();

    const [drawn, ...rest] = deck;
    if (!drawn) {
      setBusy(false);
      return;
    }
    const newDeck = rest.length > 0 ? rest : buildDeck();

    const idx = flipped;

    if (isFaceCard(drawn.rank)) {
      // Reveal as face card → penalty
      const drinks = FACE_DRINKS[drawn.rank] ?? 1;
      const newRow = row.map((s, i) =>
        i === idx ? { card: drawn, state: "face" as CardState } : s,
      );
      setRow(newRow);
      setDeck(newDeck);
      setPenaltyDrinks(drinks);
      setPhase("penalty");
      sfx.buzz();
      // After showing penalty, reset after a delay
      timerRef.current = setTimeout(() => {
        resetRun(attempts + 1);
      }, 2600);
    } else {
      // Safe — green glow, advance
      const newRow = row.map((s, i) =>
        i === idx ? { card: drawn, state: "safe" as CardState } : s,
      );
      setRow(newRow);
      setDeck(newDeck);
      const nextFlipped = flipped + 1;
      setFlipped(nextFlipped);
      setBusy(false);
      sfx.ding();

      if (nextFlipped === ROW_SIZE) {
        // All 8 cleared — WIN!
        setPhase("won");
        winTimerRef.current = setTimeout(() => {
          celebrate();
          sfx.win();
        }, 300);
      }
    }
  }

  function hardReset() {
    resetRun(1);
  }

  const drinkLabel =
    penaltyDrinks === 1
      ? "Take 1 drink!"
      : `Take ${penaltyDrinks} drinks!`;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Bus Driver"
        subtitle="Flip 8 cards without hitting a face card. J=1 · Q=2 · K=3 · A=4 drinks — then reset!"
        accent={ACCENT}
      />

      {/* attempt counter */}
      <div className="mb-5 flex items-center gap-2 text-sm text-white/50">
        <Bus size={15} style={{ color: ACCENT }} />
        <span>
          Attempt <b className="text-white">{attempts}</b>
        </span>
        <span className="text-white/25">·</span>
        <span>
          Progress{" "}
          <b style={{ color: ACCENT }}>
            {flipped}/{ROW_SIZE}
          </b>
        </span>
      </div>

      {/* card row */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 px-2">
        {row.map((slot, i) => {
          const glow =
            slot.state === "safe"
              ? "#b6ff3c"
              : slot.state === "face"
              ? "#ff5e5b"
              : ACCENT;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
            >
              <PlayingCard
                card={slot.card}
                faceDown={slot.state === "hidden"}
                size="sm"
                glow={glow}
              />
            </motion.div>
          );
        })}
      </div>

      {/* progress bar */}
      <div className="w-full max-w-xs h-1.5 glass rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full rounded-full"
          style={{ background: ACCENT }}
          animate={{ width: `${(flipped / ROW_SIZE) * 100}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        />
      </div>

      {/* feedback area */}
      <div className="min-h-[5rem] flex flex-col items-center justify-center mb-6">
        <AnimatePresence mode="wait">
          {phase === "won" ? (
            <motion.div
              key="won"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl px-8 py-5 text-center"
              style={{ boxShadow: `0 0 50px -10px ${ACCENT}` }}
            >
              <div className="text-5xl mb-2">🚌🎉</div>
              <h3
                className="font-display text-2xl neon-text mb-1"
                style={{ color: ACCENT }}
              >
                You survived the bus!
              </h3>
              <p className="text-white/60 text-sm">
                All 8 cards cleared in{" "}
                <span className="text-white font-semibold">
                  {attempts} attempt{attempts !== 1 ? "s" : ""}
                </span>
                .
              </p>
            </motion.div>
          ) : phase === "penalty" ? (
            <motion.div
              key="penalty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <DrinkCallout text={drinkLabel} accent="#ff5e5b" />
              <p className="text-white/50 text-xs">Reshuffling and resetting the row…</p>
            </motion.div>
          ) : flipped === 0 ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/40 text-sm text-center"
            >
              Hit &ldquo;Flip next&rdquo; to start your run. Avoid face cards!
            </motion.p>
          ) : (
            <motion.p
              key="safe"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-xl neon-text"
              style={{ color: "#b6ff3c" }}
            >
              Safe! Keep going… 🟢
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* action buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {phase === "won" ? (
          <NeonButton onClick={hardReset} size="lg" variant="primary">
            <Bus size={18} className="inline mr-1" /> Ride Again
          </NeonButton>
        ) : (
          <NeonButton
            onClick={flipNext}
            size="lg"
            variant="primary"
            disabled={busy || phase === "penalty" || flipped >= ROW_SIZE}
          >
            Flip next
          </NeonButton>
        )}
      </div>

      <button
        onClick={hardReset}
        className="mt-8 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> restart from scratch
      </button>
    </div>
  );
}
