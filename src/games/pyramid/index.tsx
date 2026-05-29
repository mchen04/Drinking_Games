"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { createDeck, type Card } from "@/lib/deck";
import { PlayingCard, NeonButton, DrinkCallout } from "@/components/ui";
import { celebrate } from "@/lib/confetti";
import { sfx } from "@/lib/sound";
import { useTimeouts } from "@/lib/timers";

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
  const { after, clearAll } = useTimeouts();

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
      after(400, () => {
        sfx.win();
        celebrate();
      });
    }
  }, [done, flippedCount, after]);

  const reset = useCallback(() => {
    clearAll();
    sfx.click();
    setState(buildInitial());
  }, [clearAll]);

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-white/50 text-sm text-center mb-2 sm:mb-3 max-w-xs">
        Flip cards bottom-up. Assign drinks — or bluff your rank!
      </p>

      {/* Pyramid grid — responsively scaled so it fits short/landscape viewports */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pyramid-fit flex flex-col items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4"
      >
        {[...ROW_SIZES].reverse().map((size, reversedIdx) => {
          // reversedIdx 0 = top row (row 4), reversedIdx 4 = bottom row (row 0)
          const row = ROW_SIZES.length - 1 - reversedIdx;
          const drinks = rowValue(row);
          return (
            <motion.div
              key={row}
              className="flex items-center gap-1 sm:gap-1.5"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1 + reversedIdx * 0.08,
                type: "spring",
                stiffness: 300,
                damping: 24,
              }}
            >
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
                            y: -4,
                            filter: `drop-shadow(0 0 14px ${ACCENT})`,
                          }
                        : { scale: 1, y: 0, filter: "none" }
                    }
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
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
              <motion.span
                className="ml-1 text-xs font-semibold tabular-nums w-8"
                style={{ color: `${ACCENT}cc` }}
                animate={
                  currentFlip !== null && currentFlip.row === row
                    ? { scale: [1, 1.4, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {drinks}🍺
              </motion.span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Flip button / done state */}
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: [0.85, 1.04, 1], y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
            className="glass-strong rounded-3xl p-4 sm:p-5 text-center mb-3 w-full max-w-sm"
            style={{ boxShadow: `0 0 48px -10px ${ACCENT}` }}
          >
            <motion.div
              className="text-4xl mb-1"
              animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              🔺
            </motion.div>
            <h3 className="font-display text-xl sm:text-2xl neon-text mb-1" style={{ color: ACCENT }}>
              Pyramid cleared!
            </h3>
            <p className="text-white/60 text-xs sm:text-sm">
              Every card has been revealed. Hope someone stayed honest.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="flip-action"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-2 mb-3"
          >
            <NeonButton
              onClick={flipNext}
              size="lg"
              variant="primary"
              disabled={done}
            >
              {flippedCount === 0 ? "Start — flip first card" : "Flip next card"}
            </NeonButton>
            <p className="text-white/35 text-xs tabular-nums flex items-center gap-1">
              <motion.span
                key={flippedCount}
                initial={{ scale: 1.5, color: ACCENT }}
                animate={{ scale: 1, color: "rgba(255,255,255,0.35)" }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="inline-block tabular-nums"
              >
                {flippedCount}
              </motion.span>
              /{FLIP_ORDER.length} flipped
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Callout for the current flipped card (no fixed reserve — keeps the
          pyramid + flip button on one screen in landscape) */}
      <div className="w-full max-w-md flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {currentCard && !done && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center gap-2 w-full"
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
      <motion.button
        onClick={reset}
        whileTap={{ scale: 0.94 }}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new pyramid
      </motion.button>
    </div>
  );
}
