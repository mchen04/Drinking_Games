"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { createDeck, type Card } from "@/lib/deck";
import { PlayingCard, NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { pop } from "@/lib/confetti";
import { useTimeouts } from "@/lib/timers";

interface Board {
  deck: Card[];
  current: Card;
}

function freshBoard(): Board {
  const deck = createDeck();
  return { deck, current: deck[0] };
}

export default function HigherOrLower() {
  // deck + current are initialised together so `current` always matches the deck.
  const [board, setBoard] = useState<Board>(freshBoard);
  const [next, setNext] = useState<Card | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [revealing, setRevealing] = useState(false);

  const { after, clearAll } = useTimeouts();

  function guess(higher: boolean) {
    if (revealing) return;
    clearAll();
    setRevealing(true);
    sfx.flip();
    const pool = board.deck.length > 1 ? board.deck : createDeck();
    const drawn = pool[1];
    setNext(drawn);

    after(650, () => {
      // A tie counts as a loss (you drink) — matches the classic rule + Ride the Bus.
      const correct = higher ? drawn.value > board.current.value : drawn.value < board.current.value;
      if (correct) {
        sfx.ding();
        pop(0.5, 0.4);
        setStreak((s) => {
          const nextStreak = s + 1;
          setBest((b) => Math.max(b, nextStreak));
          return nextStreak;
        });
        setResult("win");
      } else {
        sfx.buzz();
        setStreak(0);
        setResult("lose");
      }
      after(1100, () => {
        setBoard({ deck: pool.slice(1), current: drawn });
        setNext(null);
        setResult(null);
        setRevealing(false);
      });
    });
  }

  function reset() {
    clearAll();
    setBoard(freshBoard());
    setNext(null);
    setStreak(0);
    setResult(null);
    setRevealing(false);
  }

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Higher or Lower"
        subtitle="Wrong guess = take a drink. Aces are high."
        accent="#18e7ff"
      />

      <div className="flex items-center justify-center gap-6 mb-8 min-h-[14rem]">
        <div className="flex flex-col items-center gap-2">
          <PlayingCard card={board.current} size="lg" glow="#18e7ff" />
          <span className="text-xs text-white/40">current</span>
        </div>
        <span className="text-2xl text-white/30">vs</span>
        <div className="flex flex-col items-center gap-2">
          <PlayingCard card={next} faceDown={!next} size="lg" glow={result === "win" ? "#b6ff3c" : result === "lose" ? "#ff5e5b" : "#9d4edd"} />
          <span className="text-xs text-white/40">next</span>
        </div>
      </div>

      <div className="h-12 mb-4">
        <AnimatePresence>
          {result === "lose" && <DrinkCallout text="Wrong — drink!" accent="#ff5e5b" />}
          {result === "win" && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-neon-lime text-xl neon-text"
            >
              Nice! 🔥 {streak}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <NeonButton onClick={() => guess(true)} size="lg" variant="success" disabled={revealing}>
          <ChevronUp className="inline" /> Higher
        </NeonButton>
        <NeonButton onClick={() => guess(false)} size="lg" variant="danger" disabled={revealing}>
          <ChevronDown className="inline" /> Lower
        </NeonButton>
      </div>

      <div className="mt-8 flex items-center gap-6 text-sm text-white/50">
        <span>streak <b className="text-white">{streak}</b></span>
        <span>best <b className="text-neon-amber">{best}</b></span>
      </div>

      <button onClick={reset} className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors">
        <RotateCcw size={13} /> new deck
      </button>
    </div>
  );
}
