"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { RotateCcw, Heart, Spade } from "lucide-react";
import { createDeck, type Card, isRed } from "@/lib/deck";
import {
  PlayingCard,
  NeonButton,
  DrinkCallout,
  PlayerChip,
} from "@/components/ui";
import { sfx } from "@/lib/sound";
import { useTimeouts } from "@/lib/timers";
import { pop } from "@/lib/confetti";
import { usePlayers } from "@/store/players";

const ACCENT = "#18e7ff";

const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
} as const;

function ensureDeck(deck: Card[]): Card[] {
  return deck.length > 0 ? deck : createDeck();
}

export default function RedOrBlack() {
  const { players } = usePlayers();

  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [revealed, setRevealed] = useState<Card | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);

  const hasPlayers = players.length > 0;
  const currentPlayer = hasPlayers ? players[turnIndex % players.length] : null;

  const { after, clearAll } = useTimeouts();

  const guess = useCallback(
    (guessRed: boolean) => {
      if (revealing) return;
      setRevealing(true);
      sfx.flip();

      const pool = ensureDeck(deck);
      const [drawn, ...rest] = pool;

      setRevealed(drawn);

      clearAll();
      after(650, () => {
        const cardIsRed = isRed(drawn.suit);
        const correct = guessRed === cardIsRed;

        if (correct) {
          sfx.ding();
          pop(0.5, 0.4);
          setStreak((prev) => {
            const next = prev + 1;
            setBest((b) => Math.max(b, next));
            return next;
          });
          setResult("correct");
        } else {
          sfx.buzz();
          setStreak(0);
          setResult("wrong");
        }

        setDeck(rest.length > 0 ? rest : createDeck());

        after(1200, () => {
          setResult(null);
          setRevealing(false);
          if (hasPlayers) {
            setTurnIndex((t) => t + 1);
          }
        });
      });
    },
    [revealing, deck, hasPlayers],
  );

  function reset() {
    clearAll();
    setDeck(createDeck());
    setRevealed(null);
    setResult(null);
    setRevealing(false);
    setStreak(0);
    setTurnIndex(0);
  }

  const cardGlow =
    result === "correct"
      ? "#b6ff3c"
      : result === "wrong"
        ? "#ff5e5b"
        : ACCENT;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
      }}
    >
      <motion.p
        variants={ITEM}
        className="text-white/50 text-sm text-center mb-3"
      >
        Guess the colour of the next card. Wrong? Take a drink.
      </motion.p>

      {/* Player rotation */}
      {hasPlayers && (
        <motion.div
          variants={ITEM}
          className="flex flex-wrap justify-center gap-2 mb-3"
        >
          <AnimatePresence initial={false}>
            {players.map((p, i) => (
              <PlayerChip
                key={p.id}
                player={p}
                active={i === turnIndex % players.length}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Whose turn */}
      {currentPlayer && (
        <motion.p variants={ITEM} className="text-white/60 mb-2 text-sm">
          <AnimatePresence mode="wait">
            <motion.b
              key={currentPlayer.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
              style={{ color: currentPlayer.color }}
            >
              {currentPlayer.name}
            </motion.b>
          </AnimatePresence>
          &apos;s guess
        </motion.p>
      )}

      {/* Card display */}
      <motion.div
        variants={ITEM}
        className="flex flex-col items-center gap-1.5 mb-3 justify-center"
      >
        <motion.div
          className="origin-center scale-[0.82] sm:scale-100 landscape:scale-[0.62] sm:landscape:scale-90"
          animate={
            result === "wrong"
              ? { x: [0, -10, 10, -6, 6, 0] }
              : result === "correct"
                ? { y: [0, -14, 0], scale: [1, 1.06, 1] }
                : { x: 0, y: 0, scale: 1 }
          }
          transition={
            result === "wrong"
              ? { duration: 0.45 }
              : { type: "spring", stiffness: 320, damping: 16 }
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={revealed?.id ?? "facedown"}
              initial={{ rotateY: 90, opacity: 0, scale: 0.92 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: -90, opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <PlayingCard
                card={revealing && revealed ? revealed : null}
                faceDown={!revealing || !revealed}
                size="lg"
                glow={cardGlow}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <span className="text-xs text-white/40">
          {deck.length} card{deck.length !== 1 ? "s" : ""} remaining
        </span>
      </motion.div>

      {/* Result callout — overlay so it reserves no fixed block */}
      <div className="relative h-0 w-full flex items-center justify-center">
        <div className="absolute -top-1 z-10 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {result === "wrong" && (
              <DrinkCallout
                key="wrong"
                text={currentPlayer ? `${currentPlayer.name}, drink!` : "Drink!"}
                accent="#ff5e5b"
              />
            )}
            {result === "correct" && (
              <motion.p
                key="correct"
                initial={{ opacity: 0, scale: 0.6, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 340, damping: 15 }}
                className="font-display text-xl neon-text whitespace-nowrap"
                style={{ color: "#b6ff3c" }}
              >
                Nailed it! 🔥 {streak}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Guess buttons */}
      <motion.div variants={ITEM} className="flex gap-4 mt-3">
        <NeonButton
          onClick={() => guess(true)}
          size="lg"
          variant="danger"
          disabled={revealing}
        >
          <Heart className="inline mr-1" size={18} />
          Red
        </NeonButton>
        <NeonButton
          onClick={() => guess(false)}
          size="lg"
          variant="ghost"
          disabled={revealing}
        >
          <Spade className="inline mr-1" size={18} />
          Black
        </NeonButton>
      </motion.div>

      {/* Streak counters */}
      <motion.div
        variants={ITEM}
        className="mt-4 flex items-center gap-6 text-sm text-white/50"
      >
        <span className="inline-flex items-center gap-1.5">
          streak
          <AnimatePresence mode="popLayout">
            <motion.b
              key={streak}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="inline-block text-white"
            >
              {streak}
            </motion.b>
          </AnimatePresence>
        </span>
        <span className="inline-flex items-center gap-1.5">
          best
          <AnimatePresence mode="popLayout">
            <motion.b
              key={best}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="inline-block"
              style={{ color: "#ffb627" }}
            >
              {best}
            </motion.b>
          </AnimatePresence>
        </span>
      </motion.div>

      {/* Reset */}
      <motion.button
        variants={ITEM}
        onClick={reset}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new deck
      </motion.button>
    </motion.div>
  );
}
