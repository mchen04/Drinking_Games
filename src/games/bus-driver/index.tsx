"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw, Bus } from "lucide-react";
import { createDeck, type Card, type Rank } from "@/lib/deck";
import { PlayingCard, NeonButton, DrinkCallout } from "@/components/ui";
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
  const { after, clearAll } = useTimeouts();
  // Keep a live ref to attempts so timer callbacks never read a stale closure.
  const attemptsRef = useRef(1);

  // Keep attemptsRef in sync so timer callbacks always see the latest value.
  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  /** Reset the row and reshuffle the deck, incrementing attempt count. */
  const resetRun = useCallback((nextAttempts: number) => {
    clearAll();
    setRow(buildHiddenRow());
    setDeck(buildDeck());
    setFlipped(0);
    setAttempts(nextAttempts);
    setPhase("playing");
    setPenaltyDrinks(0);
    setBusy(false);
  }, [clearAll]);

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
      // After showing penalty, reset after a delay.
      clearAll();
      after(2600, () => {
        resetRun(attemptsRef.current + 1);
      });
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
        clearAll();
        after(300, () => {
          celebrate();
          sfx.win();
        });
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
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      <p className="text-white/50 text-sm text-center mb-3">
        Flip 8 cards without hitting a face card. J=1 · Q=2 · K=3 · A=4 drinks — then reset!
      </p>

      {/* attempt counter */}
      <div className="mb-3 flex items-center gap-2 text-sm text-white/50">
        <Bus size={15} style={{ color: ACCENT }} />
        <span>
          Attempt{" "}
          <motion.b
            key={attempts}
            className="text-white inline-block"
            initial={{ scale: 1.5, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            {attempts}
          </motion.b>
        </span>
        <span className="text-white/25">·</span>
        <span>
          Progress{" "}
          <motion.b
            key={flipped}
            className="inline-block"
            style={{ color: ACCENT }}
            initial={{ scale: 1.5, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            {flipped}
          </motion.b>
          /{ROW_SIZE}
        </span>
      </div>

      {/* card row */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 px-2"
        animate={phase === "penalty" ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={phase === "penalty" ? { duration: 0.45, ease: "easeInOut" } : { duration: 0.2 }}
      >
        {row.map((slot, i) => {
          const glow =
            slot.state === "safe"
              ? "#b6ff3c"
              : slot.state === "face"
              ? "#ff5e5b"
              : ACCENT;
          const isLatest = slot.state === "safe" && i === flipped - 1;
          const isFace = slot.state === "face";
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{
                scale: isFace ? [1, 1.12, 1] : isLatest ? [1, 1.18, 1] : 1,
                opacity: 1,
              }}
              transition={{
                delay: slot.state === "hidden" ? i * 0.05 : 0,
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
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
      </motion.div>

      {/* progress bar */}
      <div className="w-full max-w-xs h-1.5 glass rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ background: ACCENT }}
          animate={{ width: `${(flipped / ROW_SIZE) * 100}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        />
      </div>

      {/* feedback area */}
      <div className="min-h-[3.5rem] flex flex-col items-center justify-center mb-4">
        <AnimatePresence mode="wait">
          {phase === "won" ? (
            <motion.div
              key="won"
              initial={{ opacity: 0, scale: 0.8, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              className="glass-strong rounded-3xl px-6 py-4 text-center"
              style={{ boxShadow: `0 0 50px -10px ${ACCENT}` }}
            >
              <motion.div
                className="text-4xl sm:text-5xl mb-1"
                animate={{ y: [0, -8, 0], rotate: [0, -4, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                🚌🎉
              </motion.div>
              <h3
                className="font-display text-xl sm:text-2xl neon-text mb-1"
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
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="flex flex-col items-center gap-2"
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
        className="mt-4 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> restart from scratch
      </button>
    </motion.div>
  );
}
