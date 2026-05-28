"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { createDeck, type Card, type Suit, isRed } from "@/lib/deck";
import { PlayingCard, NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "q1" | "q2" | "q3" | "q4" | "summary";
type Outcome = "correct" | "wrong" | null;

interface RoundState {
  deck: Card[];
  cards: [Card | null, Card | null, Card | null, Card | null];
  phase: Phase;
  outcome: Outcome;
  totalDrinks: number;
  drinksThisRound: number;
  revealing: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#18e7ff";

const PHASE_DRINKS: Record<"q1" | "q2" | "q3" | "q4", number> = {
  q1: 1,
  q2: 2,
  q3: 3,
  q4: 4,
};

const PHASE_LABELS: Record<"q1" | "q2" | "q3" | "q4", string> = {
  q1: "Q1 — Red or Black?",
  q2: "Q2 — Higher or Lower?",
  q3: "Q3 — Inside or Outside?",
  q4: "Q4 — Guess the Suit?",
};

const SUIT_LABELS: { suit: Suit; label: string; color: string }[] = [
  { suit: "♠", label: "Spades ♠", color: "#9d4edd" },
  { suit: "♥", label: "Hearts ♥", color: "#ff2d95" },
  { suit: "♦", label: "Diamonds ♦", color: "#ff5e5b" },
  { suit: "♣", label: "Clubs ♣", color: "#2de2c0" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initialState(): RoundState {
  return {
    deck: createDeck(true),
    cards: [null, null, null, null],
    phase: "q1",
    outcome: null,
    totalDrinks: 0,
    drinksThisRound: 0,
    revealing: false,
  };
}

function cardIndex(phase: Phase): number {
  return phase === "q1" ? 0 : phase === "q2" ? 1 : phase === "q3" ? 2 : 3;
}

function nextPhase(phase: "q1" | "q2" | "q3" | "q4"): Phase {
  return phase === "q1" ? "q2" : phase === "q2" ? "q3" : phase === "q3" ? "q4" : "summary";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RideTheBus() {
  const [state, setState] = useState<RoundState>(initialState);
  // cancelToken increments on restart; lets in-flight timeouts no-op if stale.
  const cancelToken = useRef(0);

  const { deck, cards, phase, outcome, totalDrinks, drinksThisRound, revealing } = state;

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
    (correct: boolean, phase: "q1" | "q2" | "q3" | "q4", drawnCard: Card, updatedDeck: Card[]) => {
      const idx = cardIndex(phase);
      const newCards = [...cards] as RoundState["cards"];
      newCards[idx] = drawnCard;
      const drinks = correct ? 0 : PHASE_DRINKS[phase];
      const newTotal = totalDrinks + drinks;
      const newThisRound = drinksThisRound + drinks;

      if (correct) {
        sfx.ding();
        pop(0.5, 0.4);
      } else {
        sfx.buzz();
        drinkRain();
      }

      const token = cancelToken.current;

      setState((prev) => ({
        ...prev,
        deck: updatedDeck,
        cards: newCards,
        outcome: correct ? "correct" : "wrong",
        totalDrinks: newTotal,
        drinksThisRound: newThisRound,
        revealing: true,
      }));

      setTimeout(() => {
        if (cancelToken.current !== token) return;
        setState((prev) => ({
          ...prev,
          phase: nextPhase(phase),
          outcome: null,
          revealing: false,
        }));
      }, 1300);
    },
    [cards, totalDrinks, drinksThisRound],
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
  function guessHigher(guessHigher: boolean) {
    if (phase !== "q2") return;
    const card1 = cards[0];
    if (!card1) return;
    drawCard((drawn, rest) => {
      // exact tie = loss
      const correct = guessHigher ? drawn.value > card1.value : drawn.value < card1.value;
      resolve(correct, "q2", drawn, rest);
    });
  }

  // ── Q3: Inside or Outside (boundary = loss) ───────────────────────────────
  function guessInside(guessInside: boolean) {
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
      const correct = guessInside ? isInsideStrict : isOutsideStrict;
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
    cancelToken.current += 1;
    setState(initialState());
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const isActivePhase = (p: Phase): p is "q1" | "q2" | "q3" | "q4" =>
    p !== "summary";

  const phaseIndex = phase === "q1" ? 0 : phase === "q2" ? 1 : phase === "q3" ? 2 : phase === "q4" ? 3 : 4;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Ride the Bus 🚌"
        subtitle="Four questions, four cards. Wrong answer = drink."
        accent={ACCENT}
      />

      {/* Progress dots */}
      {phase !== "summary" && (
        <div className="flex gap-2 mb-6">
          {(["q1", "q2", "q3", "q4"] as const).map((p, i) => (
            <motion.div
              key={p}
              animate={{
                scale: i === phaseIndex ? 1.3 : 1,
                opacity: i <= phaseIndex ? 1 : 0.3,
              }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: i <= phaseIndex ? ACCENT : "#ffffff40" }}
            />
          ))}
        </div>
      )}

      {/* Card row — 4 slots */}
      <div className="flex gap-3 sm:gap-4 mb-8 justify-center">
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
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={
                  isCurrentSlot && outcome
                    ? { scale: [1, 1.08, 1], rotate: outcome === "wrong" ? [0, -4, 4, 0] : 0 }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4 }}
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
            </div>
          );
        })}
      </div>

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
            transition={{ duration: 0.28 }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            {/* Phase label */}
            <p className="text-white/60 text-sm mb-4 font-semibold tracking-wide uppercase">
              {isActivePhase(phase) ? PHASE_LABELS[phase] : ""}
            </p>

            {/* Context hint */}
            <ContextHint phase={phase} cards={cards} />

            {/* Outcome feedback */}
            <div className="h-14 flex items-center justify-center mb-3">
              <AnimatePresence>
                {outcome === "wrong" && (
                  <DrinkCallout
                    key="drink"
                    text={`Drink ${isActivePhase(phase) ? PHASE_DRINKS[phase] : ""}!`}
                    accent="#ff5e5b"
                  />
                )}
                {outcome === "correct" && (
                  <motion.p
                    key="correct"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-display text-xl neon-text"
                    style={{ color: "#b6ff3c" }}
                  >
                    Correct! 🎉
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Buttons for this phase */}
            <PhaseButtons
              phase={phase}
              revealing={revealing}
              onGuessColor={guessColor}
              onGuessHigher={guessHigher}
              onGuessInside={guessInside}
              onGuessSuit={guessSuit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running drinks tally (only while playing) */}
      {phase !== "summary" && (
        <div className="mt-8 flex items-center gap-2 text-sm text-white/40">
          <span>drinks so far:</span>
          <span className="font-bold" style={{ color: ACCENT }}>
            {totalDrinks}
          </span>
        </div>
      )}

      {/* Restart link */}
      {phase !== "summary" && (
        <button
          onClick={restart}
          className="mt-4 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
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
      <p className="text-white/50 text-sm mb-4 text-center">
        Will the next card be <span className="text-rose-400 font-semibold">Red</span> or{" "}
        <span className="text-white font-semibold">Black</span>?
      </p>
    );
  }
  if (phase === "q2") {
    const c1 = cards[0];
    return (
      <p className="text-white/50 text-sm mb-4 text-center">
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
      <p className="text-white/50 text-sm mb-4 text-center">
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
      <p className="text-white/50 text-sm mb-4 text-center">
        Pick the <span className="text-white font-semibold">Suit</span> of the final card.
      </p>
    );
  }
  return null;
}

interface PhaseButtonsProps {
  phase: Phase;
  revealing: boolean;
  onGuessColor: (red: boolean) => void;
  onGuessHigher: (higher: boolean) => void;
  onGuessInside: (inside: boolean) => void;
  onGuessSuit: (suit: Suit) => void;
}

function PhaseButtons({
  phase,
  revealing,
  onGuessColor,
  onGuessHigher,
  onGuessInside,
  onGuessSuit,
}: PhaseButtonsProps) {
  if (phase === "q1") {
    return (
      <div className="flex gap-3">
        <NeonButton
          onClick={() => onGuessColor(true)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          ♥ Red
        </NeonButton>
        <NeonButton
          onClick={() => onGuessColor(false)}
          size="lg"
          variant="ghost"
          disabled={revealing}
        >
          ♠ Black
        </NeonButton>
      </div>
    );
  }

  if (phase === "q2") {
    return (
      <div className="flex gap-3">
        <NeonButton
          onClick={() => onGuessHigher(true)}
          size="lg"
          variant="success"
          disabled={revealing}
        >
          ↑ Higher
        </NeonButton>
        <NeonButton
          onClick={() => onGuessHigher(false)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          ↓ Lower
        </NeonButton>
      </div>
    );
  }

  if (phase === "q3") {
    return (
      <div className="flex gap-3">
        <NeonButton
          onClick={() => onGuessInside(true)}
          size="lg"
          variant="success"
          disabled={revealing}
        >
          ← Inside →
        </NeonButton>
        <NeonButton
          onClick={() => onGuessInside(false)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          ↔ Outside
        </NeonButton>
      </div>
    );
  }

  if (phase === "q4") {
    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        {SUIT_LABELS.map(({ suit, label, color }) => (
          <motion.button
            key={suit}
            disabled={revealing}
            whileHover={{ scale: revealing ? 1 : 1.04, y: revealing ? 0 : -2 }}
            whileTap={{ scale: revealing ? 1 : 0.96 }}
            onClick={() => onGuessSuit(suit)}
            className={cn(
              "glass rounded-2xl px-4 py-3 text-base font-semibold border border-white/10",
              "transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:border-white/30",
            )}
            style={{ color, boxShadow: `0 0 18px -8px ${color}` }}
          >
            {label}
          </motion.button>
        ))}
      </div>
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
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="glass-strong rounded-3xl p-6 w-full max-w-sm text-center"
      style={{ boxShadow: `0 0 50px -14px ${ACCENT}` }}
    >
      <div className="text-5xl mb-3">{survived ? "🏆" : "🚌"}</div>

      <h3
        className="font-display text-2xl neon-text mb-1"
        style={{ color: survived ? "#b6ff3c" : ACCENT }}
      >
        {survived ? "Clean ride!" : "You rode the bus!"}
      </h3>

      <p className="text-white/60 text-sm mb-5">
        {survived
          ? "Not a single sip. Hero status achieved."
          : `Total drinks: `}
        {!survived && (
          <span className="font-bold text-white text-lg">{totalDrinks}</span>
        )}
      </p>

      {/* Per-question breakdown */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {(cards as (Card | null)[]).map((card, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <PlayingCard card={card} size="sm" glow={ACCENT} />
            <span className="text-[10px] text-white/40">Q{i + 1}</span>
          </div>
        ))}
      </div>

      <NeonButton onClick={onRestart} size="lg" variant="primary" fullWidth>
        Ride again 🚌
      </NeonButton>
    </motion.div>
  );
}
