"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { RotateCcw, Heart, Spade } from "lucide-react";
import { createDeck, type Card, isRed } from "@/lib/deck";
import {
  PlayingCard,
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
} from "@/components/ui";
import { sfx } from "@/lib/sound";
import { pop } from "@/lib/confetti";
import { usePlayers } from "@/store/players";

const ACCENT = "#18e7ff";

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

  const guess = useCallback(
    (guessRed: boolean) => {
      if (revealing) return;
      setRevealing(true);
      sfx.flip();

      const pool = ensureDeck(deck);
      const [drawn, ...rest] = pool;

      setRevealed(drawn);

      setTimeout(() => {
        const cardIsRed = isRed(drawn.suit);
        const correct = guessRed === cardIsRed;

        if (correct) {
          sfx.ding();
          pop(0.5, 0.4);
          const next = streak + 1;
          setStreak(next);
          setBest((b) => Math.max(b, next));
          setResult("correct");
        } else {
          sfx.buzz();
          setStreak(0);
          setResult("wrong");
        }

        setDeck(rest.length > 0 ? rest : createDeck());

        setTimeout(() => {
          setResult(null);
          setRevealing(false);
          if (hasPlayers) {
            setTurnIndex((t) => t + 1);
          }
        }, 1200);
      }, 650);
    },
    [revealing, deck, streak, hasPlayers],
  );

  function reset() {
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
    <div className="flex flex-col items-center">
      <GameHeading
        title="Red or Black"
        subtitle="Guess the colour of the next card. Wrong? Take a drink."
        accent={ACCENT}
      />

      {/* Player rotation */}
      {hasPlayers && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {players.map((p, i) => (
            <PlayerChip
              key={p.id}
              player={p}
              active={i === turnIndex % players.length}
            />
          ))}
        </div>
      )}

      {/* Whose turn */}
      {currentPlayer && (
        <p className="text-white/60 mb-4 text-sm">
          <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
          &apos;s guess
        </p>
      )}

      {/* Card display */}
      <div className="flex flex-col items-center gap-2 mb-6 min-h-[14rem] justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={revealed?.id ?? "facedown"}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PlayingCard
              card={revealing && revealed ? revealed : null}
              faceDown={!revealing || !revealed}
              size="lg"
              glow={cardGlow}
            />
          </motion.div>
        </AnimatePresence>
        <span className="text-xs text-white/40">
          {deck.length} card{deck.length !== 1 ? "s" : ""} remaining
        </span>
      </div>

      {/* Result callout */}
      <div className="h-14 mb-4 flex items-center justify-center">
        <AnimatePresence>
          {result === "wrong" && (
            <DrinkCallout
              text={
                currentPlayer ? `${currentPlayer.name}, drink!` : "Drink!"
              }
              accent="#ff5e5b"
            />
          )}
          {result === "correct" && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-xl neon-text"
              style={{ color: "#b6ff3c" }}
            >
              Nailed it! 🔥 {streak}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Guess buttons */}
      <div className="flex gap-4">
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
      </div>

      {/* Streak counters */}
      <div className="mt-8 flex items-center gap-6 text-sm text-white/50">
        <span>
          streak <b className="text-white">{streak}</b>
        </span>
        <span>
          best{" "}
          <b style={{ color: "#ffb627" }}>{best}</b>
        </span>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new deck
      </button>
    </div>
  );
}
