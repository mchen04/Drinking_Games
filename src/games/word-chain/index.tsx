"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
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

  const currentPlayer = players[turnIndex % players.length];
  const currentWord = chain[chain.length - 1];
  const usedWords = useRef<Set<string>>(new Set([currentWord.toLowerCase()]));

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
        startNextTurn((turnIndex + 1) % players.length);
      }, 2000);
    },
    [turnIndex, players.length, clearPenalty, startNextTurn],
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
  useEffect(() => {
    if (timeLeft === 0 && !penalty) {
      triggerPenalty("timeout", currentPlayer);
    }
  }, [timeLeft, penalty, currentPlayer, triggerPenalty]);

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
    if (usedWords.current.has(wordLower)) {
      triggerPenalty("repeat", currentPlayer);
      return;
    }

    // Valid word — append and advance.
    sfx.tick();
    usedWords.current.add(wordLower);
    setChain((c) => [...c, word]);

    // Clear countdown before advancing.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    startNextTurn((turnIndex + 1) % players.length);
  }

  function handleReset() {
    const starter = pickRandom(STARTER_WORDS);
    usedWords.current = new Set([starter.toLowerCase()]);
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
  const circumference = 2 * Math.PI * 26; // r=26
  const strokeDash = ringFraction * circumference;
  const ringColor =
    timeLeft <= 2 ? "#ff5e5b" : timeLeft <= 3 ? "#ffb627" : "#2de2c0";

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Word Association"
        subtitle="Say a word linked to the last one. Hesitate or repeat = drink!"
        accent={ACCENT}
      />

      {/* Player chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={!penalty && i === turnIndex % players.length}
          />
        ))}
      </div>

      {/* Current word + countdown ring */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord}
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
            className="text-5xl sm:text-6xl font-display font-bold text-white neon-text"
            style={{ textShadow: `0 0 32px ${ACCENT}` }}
          >
            {currentWord}
          </motion.div>
        </AnimatePresence>

        {/* Countdown ring */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            className="-rotate-90 absolute inset-0"
          >
            {/* Track */}
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="5"
            />
            {/* Progress arc */}
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={ringColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              animate={{
                strokeDasharray: `${strokeDash} ${circumference}`,
                stroke: ringColor,
              }}
              transition={{ duration: 0.25 }}
              style={{ filter: `drop-shadow(0 0 6px ${ringColor})` }}
            />
          </svg>
          <span
            className={cn(
              "text-lg font-display font-bold tabular-nums",
              timeLeft <= 2 ? "text-[#ff5e5b]" : "text-white",
            )}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Whose turn */}
      {!penalty && (
        <p className="text-white/60 mb-4 text-sm">
          <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
          &apos;s turn — type your word and hit Enter
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 w-full max-w-sm">
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
      </form>

      {/* Penalty callout */}
      <div className="h-16 flex items-center justify-center mb-2">
        <AnimatePresence mode="wait">
          {penalty && penaltyPlayer && (
            <motion.div
              key={`${penalty}-${penaltyPlayer.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-2"
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
      </div>

      {/* Chain history */}
      {chain.length > 1 && (
        <div className="w-full max-w-md mt-2">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2 text-center">
            Chain ({chain.length - 1} word{chain.length - 1 !== 1 ? "s" : ""})
          </p>
          <div className="glass rounded-2xl p-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto justify-center">
            <AnimatePresence>
              {chain.slice(1).map((w, i) => (
                <motion.span
                  key={`${w}-${i}`}
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
        </div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        className="mt-8 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new game
      </button>
    </div>
  );
}
