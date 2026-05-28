"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send } from "lucide-react";
import {
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import { CircleProgress } from "@/components/ui/CircleProgress";
import { sfx } from "@/lib/sound";
import { drinkRain, pop } from "@/lib/confetti";
import { pickRandom } from "@/lib/random";
import type { Player } from "@/store/players";
import { STARTERS } from "./data";

const ACCENT = "#ff5e5b";
const TURN_SECONDS = 12;

/** Extract the last alphabetic character of a name (uppercased). */
function lastAlpha(name: string): string {
  const match = name.replace(/\s+/g, "").match(/[a-zA-Z](?=[^a-zA-Z]*$)/);
  return match ? match[0].toUpperCase() : "";
}

/** Return the first alphabetic character of a name (uppercased). */
function firstAlpha(name: string): string {
  const match = name.trim().match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : "";
}

export default function NameGame() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

interface Penalty {
  playerName: string;
  reason: string;
  key: number;
}

function Game({ players }: { players: Player[] }) {
  const starter = pickRandom(STARTERS);

  const [chain, setChain] = useState<string[]>([starter]);
  const [input, setInput] = useState("");
  const [turnIdx, setTurnIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [penalty, setPenalty] = useState<Penalty | null>(null);
  const [penaltyKey, setPenaltyKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track the current turn index in a ref so that handleTimeout always reads
  // the correct player even when called from inside a stale setInterval closure.
  const turnIdxRef = useRef(turnIdx);

  const currentPlayer = players[turnIdx % players.length];
  const requiredLetter = lastAlpha(chain[chain.length - 1]);

  /** Restart the countdown for the current turn. */
  function resetTimer() {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(TURN_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleTimeout();
          return 0;
        }
        sfx.tick();
        return t - 1;
      });
    }, 1000);
  }

  // Keep the ref in sync with state on every render.
  turnIdxRef.current = turnIdx;

  // Start timer on mount and whenever the turn advances.
  useEffect(() => {
    resetTimer();
    inputRef.current?.focus();
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIdx]);

  function handleTimeout() {
    sfx.buzz();
    drinkRain();
    // Read the current turn index from the ref (not the stale closure) so that
    // the correct player is penalised even if the render has drifted.
    const timedOutIdx = turnIdxRef.current;
    const timedOutPlayer = players[timedOutIdx % players.length];
    // Use functional updater so we always read the latest penaltyKey even
    // when called from inside a stale setInterval closure.
    setPenaltyKey((k) => {
      const key = k + 1;
      setPenalty({
        playerName: timedOutPlayer.name,
        reason: "Ran out of time!",
        key,
      });
      return key;
    });
    // Advance turn but keep the chain intact.
    setTurnIdx((i) => i + 1);
    setInput("");
    setSubmitted(false);
  }

  function handleSubmit() {
    if (submitted) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const usedNames = chain.map((n) => n.toLowerCase());

    // Validation 1: must start with required letter.
    if (firstAlpha(trimmed).toUpperCase() !== requiredLetter) {
      sfx.buzz();
      setPenaltyKey((k) => {
        const key = k + 1;
        setPenalty({
          playerName: currentPlayer.name,
          reason: `Must start with "${requiredLetter}" — drink!`,
          key,
        });
        return key;
      });
      drinkRain();
      setInput("");
      setTurnIdx((i) => i + 1);
      return;
    }

    // Validation 2: must not repeat.
    if (usedNames.includes(trimmed.toLowerCase())) {
      sfx.buzz();
      setPenaltyKey((k) => {
        const key = k + 1;
        setPenalty({
          playerName: currentPlayer.name,
          reason: `"${trimmed}" already used — drink!`,
          key,
        });
        return key;
      });
      drinkRain();
      setInput("");
      setTurnIdx((i) => i + 1);
      return;
    }

    // Valid entry.
    setSubmitted(true);
    sfx.ding();
    pop(0.5, 0.45);
    setPenalty(null);
    setChain((c) => [...c, trimmed]);
    setInput("");

    // Brief pause so the chain update animates before advancing.
    setTimeout(() => {
      setSubmitted(false);
      setTurnIdx((i) => i + 1);
    }, 300);
  }

  function handleReset() {
    const newStarter = pickRandom(STARTERS);
    setChain([newStarter]);
    setInput("");
    setTurnIdx(0);
    setPenalty(null);
    setSubmitted(false);
    sfx.click();
  }

  // Ring progress: fraction remaining (1 = full, 0 = empty).
  const ringFraction = timeLeft / TURN_SECONDS;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <GameHeading
        title="The Name Game"
        subtitle={`Name a celebrity. Next must start with the last letter of the full name.`}
        accent={ACCENT}
      />

      {/* Player row */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turnIdx % players.length}
          />
        ))}
      </div>

      {/* Required letter + timer ring */}
      <div className="flex items-center gap-5 mb-6">
        {/* Timer ring */}
        <CircleProgress
          fraction={ringFraction}
          size={64}
          stroke={5}
          color={timeLeft <= 4 ? "#ff5e5b" : "#ff5e5b99"}
          trackColor="rgba(255,255,255,0.08)"
          tween={0.4}
        >
          <span
            className="font-display text-xl font-bold tabular-nums"
            style={{ color: timeLeft <= 4 ? ACCENT : "rgba(255,255,255,0.85)" }}
          >
            {timeLeft}
          </span>
        </CircleProgress>

        {/* Required letter badge */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-white/40 uppercase tracking-widest">starts with</span>
          <motion.div
            key={requiredLetter}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-4xl font-black"
            style={{
              background: `${ACCENT}22`,
              border: `2px solid ${ACCENT}`,
              color: ACCENT,
              boxShadow: `0 0 24px -6px ${ACCENT}`,
            }}
          >
            {requiredLetter}
          </motion.div>
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2 w-full mb-4"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`${currentPlayer.name}: name starting with ${requiredLetter}…`}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          disabled={submitted}
          className="flex-1 glass rounded-2xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 transition-all"
          style={{ "--tw-ring-color": ACCENT } as React.CSSProperties}
        />
        <NeonButton
          type="submit"
          size="md"
          variant="primary"
          disabled={submitted || !input.trim()}
        >
          <Send size={18} />
        </NeonButton>
      </form>

      {/* Drink callout */}
      <div className="h-14 flex items-center justify-center mb-2">
        <AnimatePresence mode="wait">
          {penalty && (
            <motion.div
              key={penalty.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-1"
            >
              <DrinkCallout
                text={`${penalty.playerName} — ${penalty.reason}`}
                accent={ACCENT}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chain history */}
      <div className="w-full glass rounded-3xl p-4 max-h-52 overflow-y-auto">
        <p className="text-xs text-white/35 uppercase tracking-widest mb-3">Name chain</p>
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {[...chain].reverse().map((name, idx) => {
              const isLatest = idx === 0;
              return (
                <motion.div
                  key={name + chain.length}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isLatest ? ACCENT : "rgba(255,255,255,0.2)" }}
                  />
                  <span
                    className={
                      isLatest
                        ? "text-white font-semibold text-sm"
                        : "text-white/50 text-sm"
                    }
                    style={isLatest ? { color: ACCENT } : undefined}
                  >
                    {name}
                  </span>
                  {isLatest && (
                    <span
                      className="ml-auto text-xs font-mono rounded-full px-2 py-0.5"
                      style={{ background: `${ACCENT}22`, color: ACCENT }}
                    >
                      → {lastAlpha(name)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={handleReset}
        className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new game
      </button>
    </div>
  );
}
