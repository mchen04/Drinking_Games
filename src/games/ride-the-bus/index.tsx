"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw } from "lucide-react";
import { createDeck, type Card, type Suit, isRed } from "@/lib/deck";
import { PlayingCard, NeonButton, DrinkCallout } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { PhaseButtons, type Phase } from "./PhaseButtons";

// ─── Types ────────────────────────────────────────────────────────────────────

type Outcome = "correct" | "wrong" | null;

interface RoundState {
  deck: Card[];
  cards: [Card | null, Card | null, Card | null, Card | null];
  phase: Phase;
  outcome: Outcome;
  totalDrinks: number;
  revealing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#18e7ff";

// Single source of truth for question phase order.
const QUESTION_PHASES = ["q1", "q2", "q3", "q4"] as const;
type QuestionPhase = (typeof QUESTION_PHASES)[number];

const PHASE_DRINKS: Record<QuestionPhase, number> = {
  q1: 1,
  q2: 2,
  q3: 3,
  q4: 4,
};

const PHASE_LABELS: Record<QuestionPhase, string> = {
  q1: "Q1 — Red or Black?",
  q2: "Q2 — Higher or Lower?",
  q3: "Q3 — Inside or Outside?",
  q4: "Q4 — Guess the Suit?",
};

// ─── Phase helpers (all derived from QUESTION_PHASES) ─────────────────────────

function phaseToIndex(phase: Phase): number {
  const idx = QUESTION_PHASES.indexOf(phase as QuestionPhase);
  return idx === -1 ? QUESTION_PHASES.length : idx; // summary → 4
}

function nextPhase(phase: QuestionPhase): Phase {
  const idx = QUESTION_PHASES.indexOf(phase);
  return idx < QUESTION_PHASES.length - 1 ? QUESTION_PHASES[idx + 1] : "summary";
}

function isQuestionPhase(phase: Phase): phase is QuestionPhase {
  return phase !== "summary";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initialState(): RoundState {
  return {
    deck: createDeck(true),
    cards: [null, null, null, null],
    phase: "q1",
    outcome: null,
    totalDrinks: 0,
    revealing: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RideTheBus() {
  const [state, setState] = useState<RoundState>(initialState);
  const { after, clearAll } = useTimeouts();

  const { deck, cards, phase, outcome, totalDrinks, revealing } = state;

  // Draw the next card and mark the reveal in-flight.
  const drawCard = useCallback(
    (onDrawn: (card: Card, updatedDeck: Card[]) => void) => {
      if (revealing) return;
      sfx.flip();
      const [drawn, ...rest] = deck;
      onDrawn(drawn, rest);
    },
    [deck, revealing],
  );

  // Shared resolve: sets outcome, plays sfx/fx, then after delay advances phase.
  const resolve = useCallback(
    (correct: boolean, qPhase: QuestionPhase, drawnCard: Card, updatedDeck: Card[]) => {
      const idx = phaseToIndex(qPhase);
      const newCards = [...cards] as RoundState["cards"];
      newCards[idx] = drawnCard;
      const drinks = correct ? 0 : PHASE_DRINKS[qPhase];
      const newTotal = totalDrinks + drinks;

      if (correct) {
        sfx.ding();
        pop(0.5, 0.4);
      } else {
        sfx.buzz();
        drinkRain();
      }

      setState((prev) => ({
        ...prev,
        deck: updatedDeck,
        cards: newCards,
        outcome: correct ? "correct" : "wrong",
        totalDrinks: newTotal,
        revealing: true,
      }));

      after(1300, () => {
        setState((prev) => ({
          ...prev,
          phase: nextPhase(qPhase),
          outcome: null,
          revealing: false,
        }));
      });
    },
    [cards, totalDrinks, after],
  );

  // ── Q1: Red or Black ──────────────────────────────────────────────────────
  function guessColor(guessRed: boolean) {
    if (phase !== "q1") return;
    drawCard((drawn, rest) => {
      const correct = guessRed === isRed(drawn.suit);
      resolve(correct, "q1", drawn, rest);
    });
  }

  // ── Q2: Higher or Lower (ties = loss) ────────────────────────────────────
  function guessHigher(higher: boolean) {
    if (phase !== "q2") return;
    const card1 = cards[0];
    if (!card1) return;
    drawCard((drawn, rest) => {
      // exact tie = loss
      const correct = higher ? drawn.value > card1.value : drawn.value < card1.value;
      resolve(correct, "q2", drawn, rest);
    });
  }

  // ── Q3: Inside or Outside (boundary = loss) ───────────────────────────────
  function guessInside(inside: boolean) {
    if (phase !== "q3") return;
    const card1 = cards[0];
    const card2 = cards[1];
    if (!card1 || !card2) return;
    drawCard((drawn, rest) => {
      const lo = Math.min(card1.value, card2.value);
      const hi = Math.max(card1.value, card2.value);
      // boundary (equal to lo or hi) = loss
      const isInsideStrict = drawn.value > lo && drawn.value < hi;
      const isOutsideStrict = drawn.value < lo || drawn.value > hi;
      const correct = inside ? isInsideStrict : isOutsideStrict;
      resolve(correct, "q3", drawn, rest);
    });
  }

  // ── Q4: Guess the Suit ────────────────────────────────────────────────────
  function guessSuit(suit: Suit) {
    if (phase !== "q4") return;
    drawCard((drawn, rest) => {
      const correct = drawn.suit === suit;
      resolve(correct, "q4", drawn, rest);
    });
  }

  // ── Restart ───────────────────────────────────────────────────────────────
  function restart() {
    sfx.whoosh();
    clearAll();
    setState(initialState());
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const phaseIndex = phaseToIndex(phase);

  return (
    <div className="flex flex-col items-center">
      {phase !== "summary" && (
        <p className="text-white/50 text-sm text-center mb-3">
          Four questions, four cards. Wrong answer = drink.
        </p>
      )}

      {/* Progress dots */}
      {phase !== "summary" && (
        <div className="flex gap-2 mb-4">
          {QUESTION_PHASES.map((p, i) => (
            <motion.div
              key={p}
              animate={{
                scale: i === phaseIndex ? 1.3 : 1,
                opacity: i <= phaseIndex ? 1 : 0.3,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: i <= phaseIndex ? ACCENT : "#ffffff40" }}
            />
          ))}
        </div>
      )}

      {/* Card row — 4 slots */}
      <motion.div
        className="flex gap-3 sm:gap-4 mb-4 justify-center"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {(cards as (Card | null)[]).map((card, i) => {
          const isCurrentSlot = i === phaseIndex && phase !== "summary";
          const glow =
            isCurrentSlot && outcome === "correct"
              ? "#b6ff3c"
              : isCurrentSlot && outcome === "wrong"
                ? "#ff5e5b"
                : card
                  ? ACCENT
                  : undefined;

          return (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1.5"
              variants={{
                hidden: { opacity: 0, y: -28, rotate: -8, scale: 0.8 },
                show: {
                  opacity: 1,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 300, damping: 22 },
                },
              }}
            >
              <motion.div
                animate={
                  isCurrentSlot && outcome
                    ? outcome === "wrong"
                      ? { scale: [1, 1.08, 1], rotate: [0, -8, 8, -5, 5, 0], x: [0, -6, 6, -3, 3, 0] }
                      : { scale: [1, 1.14, 1], rotate: 0 }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <PlayingCard
                  card={card}
                  faceDown={!card}
                  size="sm"
                  glow={glow}
                />
              </motion.div>
              {phase !== "summary" && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: i < phaseIndex ? ACCENT : i === phaseIndex ? "#fff" : "#ffffff33" }}
                >
                  Q{i + 1}
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main interaction area */}
      <AnimatePresence mode="wait">
        {phase === "summary" ? (
          <Summary
            key="summary"
            totalDrinks={totalDrinks}
            cards={cards as [Card | null, Card | null, Card | null, Card | null]}
            onRestart={restart}
          />
        ) : (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            {/* Phase label (dynamic per-question heading) */}
            <motion.p
              key={phase}
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="font-display text-base neon-text mb-2 tracking-wide"
              style={{ color: ACCENT }}
            >
              {isQuestionPhase(phase) ? PHASE_LABELS[phase] : ""}
            </motion.p>

            {/* Context hint */}
            <ContextHint phase={phase} cards={cards} />

            {/* Buttons for this phase (outcome callout overlays above) */}
            <div className="relative w-full flex justify-center">
              <AnimatePresence>
                {outcome === "wrong" && (
                  <motion.div
                    key="drink"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-10"
                  >
                    <DrinkCallout
                      text={`Drink ${isQuestionPhase(phase) ? PHASE_DRINKS[phase] : ""}!`}
                      accent="#ff5e5b"
                    />
                  </motion.div>
                )}
                {outcome === "correct" && (
                  <motion.p
                    key="correct"
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16 }}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-10 font-display text-xl neon-text whitespace-nowrap"
                    style={{ color: "#b6ff3c" }}
                  >
                    Correct! 🎉
                  </motion.p>
                )}
              </AnimatePresence>

              <PhaseButtons
                phase={phase}
                revealing={revealing}
                onGuessColor={guessColor}
                onGuessHigher={guessHigher}
                onGuessInside={guessInside}
                onGuessSuit={guessSuit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running drinks tally (only while playing) */}
      {phase !== "summary" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-white/40">
          <span>drinks so far:</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={totalDrinks}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 18 }}
              className="font-bold tabular-nums"
              style={{ color: ACCENT }}
            >
              {totalDrinks}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      {/* Restart link */}
      {phase !== "summary" && (
        <button
          onClick={restart}
          className="mt-3 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
        >
          <RotateCcw size={12} /> start over
        </button>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ContextHint({
  phase,
  cards,
}: {
  phase: Phase;
  cards: [Card | null, Card | null, Card | null, Card | null];
}) {
  if (phase === "q1") {
    return (
      <p className="text-white/50 text-sm mb-3 text-center">
        Will the next card be <span className="text-rose-400 font-semibold">Red</span> or{" "}
        <span className="text-white font-semibold">Black</span>?
      </p>
    );
  }
  if (phase === "q2") {
    const c1 = cards[0];
    return (
      <p className="text-white/50 text-sm mb-3 text-center">
        Card 1 is{" "}
        <span className="text-white font-semibold">
          {c1 ? `${c1.rank}${c1.suit}` : "?"}
        </span>
        . Will the next card be <span className="text-white font-semibold">Higher or Lower</span>?{" "}
        <span className="text-white/30">(tie = drink)</span>
      </p>
    );
  }
  if (phase === "q3") {
    const c1 = cards[0];
    const c2 = cards[1];
    return (
      <p className="text-white/50 text-sm mb-3 text-center">
        Cards{" "}
        <span className="text-white font-semibold">
          {c1 ? `${c1.rank}${c1.suit}` : "?"} &amp; {c2 ? `${c2.rank}${c2.suit}` : "?"}
        </span>
        . Will card 3 be <span className="text-white font-semibold">Inside or Outside</span> that range?{" "}
        <span className="text-white/30">(boundary = drink)</span>
      </p>
    );
  }
  if (phase === "q4") {
    return (
      <p className="text-white/50 text-sm mb-3 text-center">
        Pick the <span className="text-white font-semibold">Suit</span> of the final card.
      </p>
    );
  }
  return null;
}

function Summary({
  totalDrinks,
  cards,
  onRestart,
}: {
  totalDrinks: number;
  cards: [Card | null, Card | null, Card | null, Card | null];
  onRestart: () => void;
}) {
  const survived = totalDrinks === 0;

  return (
    <motion.div
      key="summary"
      initial={{ opacity: 0, scale: 0.88, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="glass-strong rounded-3xl p-5 w-full max-w-sm text-center"
      style={{ boxShadow: `0 0 50px -14px ${survived ? "#b6ff3c" : ACCENT}` }}
    >
      <motion.div
        className="text-5xl mb-2"
        initial={{ scale: 0, rotate: survived ? -20 : 0 }}
        animate={
          survived
            ? { scale: [0, 1.3, 1], y: [0, -10, 0], rotate: [-20, 0, 0] }
            : { scale: 1, x: [0, -10, 10, -6, 6, 0] }
        }
        transition={{
          delay: 0.15,
          duration: survived ? 0.7 : 0.5,
          type: survived ? "spring" : "tween",
          stiffness: 260,
        }}
      >
        {survived ? "🏆" : "🚌"}
      </motion.div>

      <motion.h3
        className="font-display text-2xl neon-text mb-1"
        style={{ color: survived ? "#b6ff3c" : ACCENT }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {survived ? "Clean ride!" : "You rode the bus!"}
      </motion.h3>

      <p className="text-white/60 text-sm mb-4">
        {survived
          ? "Not a single sip. Hero status achieved."
          : `Total drinks: `}
        {!survived && (
          <motion.span
            className="font-bold text-white text-lg tabular-nums inline-block"
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.35 }}
          >
            {totalDrinks}
          </motion.span>
        )}
      </p>

      {/* Per-question breakdown */}
      <motion.div
        className="grid grid-cols-4 gap-2 mb-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
      >
        {(cards as (Card | null)[]).map((card, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1"
            variants={{
              hidden: { opacity: 0, y: 14, rotate: -6, scale: 0.85 },
              show: {
                opacity: 1,
                y: 0,
                rotate: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              },
            }}
          >
            <PlayingCard card={card} size="sm" glow={ACCENT} />
            <span className="text-[10px] text-white/40">Q{i + 1}</span>
          </motion.div>
        ))}
      </motion.div>

      <NeonButton onClick={onRestart} size="lg" variant="primary" fullWidth>
        Ride again 🚌
      </NeonButton>
    </motion.div>
  );
}
