"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { createDeck, type Card } from "@/lib/deck";
import { PlayingCard, NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { celebrate } from "@/lib/confetti";
import { sfx } from "@/lib/sound";

const ACCENT = "#18e7ff";

/** Pyramid shape: row 0 = bottom (5 cards, 1 drink), row 4 = top (1 card, 5 drinks). */
const ROW_SIZES = [5, 4, 3, 2, 1] as const;
const TOTAL_CARDS = 15; // 5+4+3+2+1

/** Build the flat list of (rowIndex, colIndex) in flip order: bottom row L→R, then up. */
function buildFlipOrder(): Array<{ row: number; col: number }> {
  const order: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < ROW_SIZES.length; r++) {
    for (let c = 0; c < ROW_SIZES[r]; c++) {
      order.push({ row: r, col: c });
    }
  }
  return order;
}

const FLIP_ORDER = buildFlipOrder();

/** Convert (row, col) to a flat card index in the cards array. */
function cardIndex(row: number, col: number): number {
  let idx = 0;
  for (let r = 0; r < row; r++) idx += ROW_SIZES[r];
  return idx + col;
}

/** Drink value for each row (0-indexed from bottom). */
function rowValue(row: number): number {
  return row + 1;
}

interface PyramidState {
  cards: Card[];
  flippedCount: number;
  done: boolean;
}

function buildInitial(): PyramidState {
  const deck = createDeck(true);
  return {
    cards: deck.slice(0, TOTAL_CARDS),
    flippedCount: 0,
    done: false,
  };
}

export default function Pyramid() {
  const [state, setState] = useState<PyramidState>(buildInitial);

  const { cards, flippedCount, done } = state;

  const currentFlip =
    flippedCount > 0 && flippedCount <= FLIP_ORDER.length
      ? FLIP_ORDER[flippedCount - 1]
      : null;

  const currentCard =
    currentFlip !== null
      ? cards[cardIndex(currentFlip.row, currentFlip.col)]
      : null;

  const currentDrinks = currentFlip !== null ? rowValue(currentFlip.row) : 0;

  const flipNext = useCallback(() => {
    if (done || flippedCount >= FLIP_ORDER.length) return;
    sfx.flip();
    const nextCount = flippedCount + 1;
    const isDone = nextCount >= FLIP_ORDER.length;
    setState((s) => ({ ...s, flippedCount: nextCount, done: isDone }));
    if (isDone) {
      setTimeout(() => {
        sfx.win();
        celebrate();
      }, 400);
    }
  }, [done, flippedCount]);

  const reset = useCallback(() => {
    sfx.click();
    setState(buildInitial());
  }, []);

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Pyramid"
        subtitle="Flip cards bottom-up. Assign drinks — or bluff your rank!"
        accent={ACCENT}
      />

      {/* Pyramid grid */}
      <div className="flex flex-col items-center gap-1.5 mb-8">
        {[...ROW_SIZES].reverse().map((size, reversedIdx) => {
          // reversedIdx 0 = top row (row 4), reversedIdx 4 = bottom row (row 0)
          const row = ROW_SIZES.length - 1 - reversedIdx;
          const drinks = rowValue(row);
          return (
            <div key={row} className="flex items-center gap-1.5">
              {Array.from({ length: size }).map((_, col) => {
                const idx = cardIndex(row, col);
                const isFlipped = idx < flippedCount;
                const isCurrent =
                  currentFlip !== null &&
                  currentFlip.row === row &&
                  currentFlip.col === col;
                const card = cards[idx];

                return (
                  <motion.div
                    key={card.id}
                    initial={false}
                    animate={
                      isCurrent
                        ? {
                            scale: 1.08,
                            filter: `drop-shadow(0 0 12px ${ACCENT})`,
                          }
                        : { scale: 1, filter: "none" }
                    }
                    transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  >
                    <PlayingCard
                      card={card}
                      faceDown={!isFlipped}
                      size="sm"
                      glow={isCurrent ? ACCENT : isFlipped ? "#ffffff44" : undefined}
                    />
                  </motion.div>
                );
              })}
              {/* drink value label on the right */}
              <span
                className="ml-1 text-xs font-semibold tabular-nums w-8"
                style={{ color: `${ACCENT}cc` }}
              >
                {drinks}🍺
              </span>
            </div>
          );
        })}
      </div>

      {/* Flip button / done state */}
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-strong rounded-3xl p-6 text-center mb-6 w-full max-w-sm"
            style={{ boxShadow: `0 0 48px -10px ${ACCENT}` }}
          >
            <div className="text-5xl mb-2">🔺</div>
            <h3 className="font-display text-2xl neon-text mb-1" style={{ color: ACCENT }}>
              Pyramid cleared!
            </h3>
            <p className="text-white/60 text-sm">
              Every card has been revealed. Hope someone stayed honest.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="flip-action"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <NeonButton
              onClick={flipNext}
              size="lg"
              variant="primary"
              disabled={done}
            >
              {flippedCount === 0 ? "Start — flip first card" : "Flip next card"}
            </NeonButton>
            <p className="text-white/35 text-xs tabular-nums">
              {flippedCount}/{FLIP_ORDER.length} flipped
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Callout for the current flipped card */}
      <div className="min-h-[5rem] w-full max-w-md flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {currentCard && !done && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <DrinkCallout
                text={`Assign ${currentDrinks} drink${currentDrinks > 1 ? "s" : ""} — or bluff!`}
                accent={ACCENT}
              />
              <p className="text-white/50 text-xs text-center max-w-xs">
                Claim you hold a{" "}
                <span className="text-white font-semibold">{currentCard.rank}</span>
                {" "}and assign drinks. Others can challenge — if you lied, you drink double.
              </p>
            </motion.div>
          )}
          {done && (
            <motion.p
              key="cleared"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/40 text-xs text-center"
            >
              Start a new pyramid whenever you&apos;re ready.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new pyramid
      </button>
    </div>
  );
}
