"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  NeonButton,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import { CircleProgress } from "@/components/ui/CircleProgress";
import { sfx } from "@/lib/sound";
import { drinkRain } from "@/lib/confetti";
import { pickRandom } from "@/lib/random";
import { cn } from "@/lib/cn";
import type { Player } from "@/store/players";
import { STARTER_WORDS } from "./data";

const ACCENT = "#ff5e5b";
const TURN_SECONDS = 5;

// ---------------------------------------------------------------------------
// Root — gate on ≥2 players
// ---------------------------------------------------------------------------
export default function WordChain() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

// ---------------------------------------------------------------------------
// Game inner component
// ---------------------------------------------------------------------------
function Game({ players }: { players: Player[] }) {
  const [chain, setChain] = useState<string[]>(() => [pickRandom(STARTER_WORDS)]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [penalty, setPenalty] = useState<"timeout" | "repeat" | null>(null);
  const [penaltyPlayer, setPenaltyPlayer] = useState<Player | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const penaltyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnIndexRef = useRef(turnIndex);

  // Keep turnIndexRef in sync so interval/timeout callbacks always read the
  // current turn index rather than a stale closure value.
  useEffect(() => {
    turnIndexRef.current = turnIndex;
  }, [turnIndex]);

  const currentPlayer = players[turnIndex % players.length];
  const currentWord = chain[chain.length - 1];
  const usedWords = useMemo(() => new Set(chain.map((w) => w.toLowerCase())), [chain]);

  // Clear a penalty after a brief display window.
  const clearPenalty = useCallback(() => {
    setPenalty(null);
    setPenaltyPlayer(null);
  }, []);

  // Advance to the next player and reset the countdown.
  const startNextTurn = useCallback(
    (nextIndex: number) => {
      setTurnIndex(nextIndex);
      setTimeLeft(TURN_SECONDS);
      setInput("");
      inputRef.current?.focus();
    },
    [],
  );

  // Trigger a penalty (timeout or repeat).
  const triggerPenalty = useCallback(
    (kind: "timeout" | "repeat", player: Player) => {
      sfx.buzz();
      drinkRain();
      setPenalty(kind);
      setPenaltyPlayer(player);

      // Clear any running timer while penalty is shown.
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // After 2s auto-dismiss and continue to next turn.
      penaltyTimeoutRef.current = setTimeout(() => {
        clearPenalty();
        setTurnIndex((t) => t + 1); // monotonic; modulo is applied only in render
        setTimeLeft(TURN_SECONDS);
        setInput("");
        inputRef.current?.focus();
      }, 2000);
    },
    [clearPenalty],
  );

  // Run the countdown. Restart whenever turnIndex or penalty changes.
  useEffect(() => {
    // Don't run timer while penalty is visible.
    if (penalty) return;

    setTimeLeft(TURN_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Will fire penalty in the next tick via the 0-check below.
          return 0;
        }
        sfx.tick();
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, penalty]);

  // Watch for timeLeft hitting 0 to fire the penalty.
  // Read the player from turnIndexRef so we capture whoever is actually on
  // the clock right now, not the player from the render that last registered
  // this effect (which may have advanced since the interval started).
  useEffect(() => {
    if (timeLeft === 0 && !penalty) {
      triggerPenalty("timeout", players[turnIndexRef.current % players.length]);
    }
  }, [timeLeft, penalty, players, triggerPenalty]);

  // Cleanup all timers on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (penaltyTimeoutRef.current) clearTimeout(penaltyTimeoutRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const word = input.trim();
    if (!word || penalty) return;

    const wordLower = word.toLowerCase();

    // Check for repeated word.
    if (usedWords.has(wordLower)) {
      triggerPenalty("repeat", currentPlayer);
      return;
    }

    // Valid word — append and advance.
    sfx.tick();
    setChain((c) => [...c, word]);

    // Clear countdown before advancing.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    startNextTurn(turnIndex + 1); // monotonic; modulo is applied only in render
  }

  function handleReset() {
    const starter = pickRandom(STARTER_WORDS);
    setChain([starter]);
    setTurnIndex(0);
    setInput("");
    setTimeLeft(TURN_SECONDS);
    setPenalty(null);
    setPenaltyPlayer(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (penaltyTimeoutRef.current) clearTimeout(penaltyTimeoutRef.current);
    inputRef.current?.focus();
  }

  // Fraction of time remaining for the ring.
  const ringFraction = timeLeft / TURN_SECONDS;
  const ringColor =
    timeLeft <= 2 ? "#ff5e5b" : timeLeft <= 3 ? "#ffb627" : "#2de2c0";

  return (
    <motion.div
      className="relative flex flex-col items-center w-full"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
      }}
    >
      {/* Compact rule line (game title lives in the shell header) */}
      <motion.p
        variants={ITEM_VARIANTS}
        className="text-white/50 text-sm text-center mb-3"
      >
        Say a word linked to the last one. Hesitate or repeat = drink!
      </motion.p>

      {/* Player chips — turn passes ripple across the roster */}
      <motion.div
        variants={ITEM_VARIANTS}
        className="flex flex-wrap justify-center gap-2 mb-3"
      >
        {players.map((p, i) => {
          const isActive = !penalty && i === turnIndex % players.length;
          return (
            <motion.div
              key={p.id}
              layout
              animate={isActive ? { y: [0, -4, 0] } : { y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
            >
              <PlayerChip player={p} active={isActive} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Current word + countdown ring */}
      <motion.div
        variants={ITEM_VARIANTS}
        className="relative flex flex-col items-center gap-3 mb-3"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord}
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
            className="text-4xl sm:text-6xl font-display font-bold text-white neon-text"
            style={{ textShadow: `0 0 32px ${ACCENT}` }}
          >
            {currentWord}
          </motion.div>
        </AnimatePresence>

        {/* Countdown ring — shakes when the clock runs out */}
        <motion.div
          animate={penalty === "timeout" ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CircleProgress
            fraction={ringFraction}
            size={60}
            stroke={5}
            color={ringColor}
            tween={0.25}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 20 }}
                className={cn(
                  "text-lg font-display font-bold tabular-nums",
                  timeLeft <= 2 ? "text-[#ff5e5b]" : "text-white",
                )}
              >
                {timeLeft}
              </motion.span>
            </AnimatePresence>
          </CircleProgress>
        </motion.div>
      </motion.div>

      {/* Whose turn */}
      <div className="h-5 mb-2 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!penalty && (
            <motion.p
              key={currentPlayer.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="text-white/60 text-sm"
            >
              <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
              &apos;s turn — type your word and hit Enter
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <motion.form
        variants={ITEM_VARIANTS}
        onSubmit={handleSubmit}
        className="flex gap-2 mb-3 w-full max-w-sm"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!penalty}
          placeholder="Your word…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            "flex-1 glass rounded-2xl px-4 py-3 text-white placeholder:text-white/30 outline-none",
            "focus:ring-2 transition-shadow",
            penalty ? "opacity-40 cursor-not-allowed" : "focus:ring-[#ff5e5b]/50",
          )}
          style={
            !penalty
              ? { boxShadow: `0 0 0 1px ${ACCENT}44` }
              : undefined
          }
        />
        <NeonButton
          type="submit"
          size="md"
          variant="primary"
          disabled={!!penalty || !input.trim()}
        >
          Go
        </NeonButton>
      </motion.form>

      {/* Chain history */}
      {chain.length > 1 && (
        <motion.div variants={ITEM_VARIANTS} className="w-full max-w-md">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-1.5 text-center">
            Chain ({chain.length - 1} word{chain.length - 1 !== 1 ? "s" : ""})
          </p>
          <div className="glass rounded-2xl p-3 flex flex-wrap gap-2 max-h-24 overflow-y-auto justify-center">
            <AnimatePresence>
              {chain.slice(1).map((w, i) => (
                <motion.span
                  key={`${w}-${i}`}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 460, damping: 22 }}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: `${ACCENT}22`,
                    border: `1px solid ${ACCENT}55`,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {w}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new game
      </button>

      {/* Penalty callout — overlaid so it reserves no vertical space */}
      <AnimatePresence>
        {penalty && penaltyPlayer && (
          <motion.div
            key={`${penalty}-${penaltyPlayer.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <DrinkCallout
              text={
                penalty === "timeout"
                  ? `${penaltyPlayer.name} — too slow! Drink!`
                  : `${penaltyPlayer.name} — repeated word! Drink!`
              }
              accent={ACCENT}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Shared entrance variant for the staggered reveal.
const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 },
  },
};
