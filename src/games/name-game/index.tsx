"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send } from "lucide-react";
import {
  NeonButton,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import { CircleProgress } from "@/components/ui/CircleProgress";
import { useTimeouts } from "@/lib/timers";
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

  const { after, clearAll } = useTimeouts();

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
          return 0; // the timeLeft===0 effect fires the penalty (no side effects in the updater)
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

  // Fire the timeout penalty when the countdown hits zero. Kept out of the
  // setTimeLeft updater so the updater stays pure (no side effects).
  useEffect(() => {
    if (timeLeft === 0) handleTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

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
    after(300, () => {
      setSubmitted(false);
      setTurnIdx((i) => i + 1);
    });
  }

  function handleReset() {
    clearAll();
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

  const lowTime = timeLeft <= 4;

  return (
    <motion.div
      className="flex flex-col items-center w-full max-w-lg mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-white/50 text-sm text-center mb-3">
        Name a celebrity. Next must start with the last letter of the full name.
      </p>

      {/* Player row */}
      <motion.div layout className="flex flex-wrap justify-center gap-2 mb-3 sm:mb-4">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turnIdx % players.length}
          />
        ))}
      </motion.div>

      {/* Required letter + timer ring — the turn-pass hero */}
      <div className="flex items-center gap-4 sm:gap-5 mb-3 sm:mb-4">
        {/* Timer ring */}
        <motion.div
          animate={
            lowTime
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={
            lowTime
              ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        >
          <CircleProgress
            fraction={ringFraction}
            size={64}
            stroke={5}
            color={lowTime ? "#ff5e5b" : "#ff5e5b99"}
            trackColor="rgba(255,255,255,0.08)"
            tween={0.4}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className="font-display text-xl font-bold tabular-nums"
                style={{ color: lowTime ? ACCENT : "rgba(255,255,255,0.85)" }}
              >
                {timeLeft}
              </motion.span>
            </AnimatePresence>
          </CircleProgress>
        </motion.div>

        {/* Letter handoff: last letter of previous → required start letter */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-white/40 uppercase tracking-widest">starts with</span>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={requiredLetter + chain.length}
              initial={{ scale: 0.4, opacity: 0, rotate: -12, y: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
              exit={{ scale: 0.6, opacity: 0, y: 6 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-display text-3xl sm:text-4xl font-black"
              style={{
                background: `${ACCENT}22`,
                border: `2px solid ${ACCENT}`,
                color: ACCENT,
                boxShadow: `0 0 24px -6px ${ACCENT}`,
              }}
            >
              {requiredLetter}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Input — shakes on penalty */}
      <motion.form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2 w-full mb-3"
        animate={penalty ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        key={penalty ? `shake-${penalty.key}` : "calm"}
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
      </motion.form>

      {/* Chain history */}
      <div className="relative w-full">
        <div className="w-full glass rounded-3xl p-4 max-h-40 sm:max-h-48 overflow-y-auto">
          <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Name chain</p>
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {[...chain].reverse().map((name, idx) => {
                const isLatest = idx === 0;
                return (
                  <motion.div
                    key={name + chain.length}
                    layout
                    initial={{ opacity: 0, x: -12, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
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

        {/* Drink callout — overlaid so it doesn't reserve vertical space */}
        <AnimatePresence>
          {penalty && (
            <motion.div
              key={penalty.key}
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            >
              <DrinkCallout
                text={`${penalty.playerName} — ${penalty.reason}`}
                accent={ACCENT}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={handleReset}
        className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new game
      </button>
    </motion.div>
  );
}
