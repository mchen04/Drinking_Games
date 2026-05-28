"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { celebrate, drinkRain } from "@/lib/confetti";
import { sfx } from "@/lib/sound";

const ACCENT = "#9d4edd";
const ROUND_SECONDS = 60;

const ROUND_OPTIONS = [10, 20, 30, 60] as const;
type RoundOption = (typeof ROUND_OPTIONS)[number];

// SVG ring constants
const RING_R = 88;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
const SVG_SIZE = (RING_R + RING_STROKE) * 2 + 4;
const CENTER = SVG_SIZE / 2;

function formatElapsed(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PowerHour() {
  const [totalRounds, setTotalRounds] = useState<RoundOption>(60);
  const [round, setRound] = useState(1);
  const [secsLeft, setSecsLeft] = useState(ROUND_SECONDS);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [showDrink, setShowDrink] = useState(false);
  // Total elapsed in seconds (does not count paused time)
  const elapsed = (round - 1) * ROUND_SECONDS + (ROUND_SECONDS - secsLeft);

  // Ref so interval callback always sees latest state without recreating
  const stateRef = useRef({ round, secsLeft, totalRounds, done });
  stateRef.current = { round, secsLeft, totalRounds, done };

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (s.done) return;

    const next = s.secsLeft - 1;

    if (next > 0) {
      sfx.tick();
      setSecsLeft(next);
    } else {
      // Round complete
      const nextRound = s.round + 1;
      if (nextRound > s.totalRounds) {
        // Power hour complete!
        setSecsLeft(0);
        setRunning(false);
        setDone(true);
        sfx.win();
        setTimeout(() => {
          celebrate();
          drinkRain();
        }, 200);
      } else {
        sfx.ding();
        setShowDrink(true);
        drinkRain();
        setRound(nextRound);
        setSecsLeft(ROUND_SECONDS);
        setTimeout(() => setShowDrink(false), 1800);
      }
    }
  }, []);

  useEffect(() => {
    if (running && !done) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTick();
    }
    return clearTick;
  }, [running, done, tick, clearTick]);

  function handleStartPause() {
    if (done) return;
    sfx.click();
    setRunning((r) => !r);
  }

  function resetState() {
    clearTick();
    setRunning(false);
    setDone(false);
    setRound(1);
    setSecsLeft(ROUND_SECONDS);
    setShowDrink(false);
  }

  function handleReset() {
    sfx.click();
    resetState();
  }

  function handleSetRounds(r: RoundOption) {
    if (running) return;
    setTotalRounds(r);
    resetState();
    // Patch ref immediately so any in-flight tick sees the new total
    stateRef.current.totalRounds = r;
  }

  // Ring progress: fraction of current round remaining
  const progress = secsLeft / ROUND_SECONDS; // 1 → full, 0 → empty
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  // Glow intensity pulses on last 10s
  const isUrgent = secsLeft <= 10 && running && !done;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Power Hour"
        subtitle="Take a sip of beer every time the bell rings — once per minute for the full hour."
        accent={ACCENT}
      />

      {/* Round selector */}
      {!running && !done && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 glass rounded-full p-1"
        >
          <span className="text-white/40 text-xs pl-3">rounds</span>
          {ROUND_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => handleSetRounds(r)}
              className={
                "px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors " +
                (totalRounds === r
                  ? "text-ink"
                  : "text-white/60 hover:text-white")
              }
              style={totalRounds === r ? { background: ACCENT } : undefined}
            >
              {r}
            </button>
          ))}
        </motion.div>
      )}

      {/* Progress ring */}
      <div className="relative mb-8 flex items-center justify-center">
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={RING_STROKE}
          />
          {/* Progress arc */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            fill="none"
            stroke={isUrgent ? "#ff5e5b" : ACCENT}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.5, ease: "linear" }}
            style={{
              filter: `drop-shadow(0 0 ${isUrgent ? 16 : 10}px ${isUrgent ? "#ff5e5b" : ACCENT})`,
            }}
          />
        </svg>

        {/* Inner content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ transform: "rotate(0deg)" }}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-4xl">🏆</span>
                <span
                  className="font-display text-lg font-bold"
                  style={{ color: ACCENT }}
                >
                  Done!
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-0.5"
              >
                <span
                  className={
                    "font-display text-5xl font-bold tabular-nums " +
                    (isUrgent ? "text-neon-coral" : "text-white")
                  }
                  style={!isUrgent ? { color: ACCENT } : undefined}
                >
                  {String(secsLeft).padStart(2, "0")}
                </span>
                <span className="text-white/40 text-xs uppercase tracking-widest">
                  seconds
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Drink callout */}
      <div className="h-14 flex items-center justify-center mb-4">
        <AnimatePresence>
          {showDrink && (
            <DrinkCallout text="DRINK! 🍺" accent={ACCENT} />
          )}
          {done && (
            <motion.p
              key="complete"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-xl text-white neon-text text-center"
              style={{ color: ACCENT }}
            >
              Power Hour complete!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 text-sm text-white/50 mb-8">
        <span>
          Round{" "}
          <b className="text-white">
            {Math.min(round, totalRounds)}
          </b>
          <span className="text-white/30"> / {totalRounds}</span>
        </span>
        <span>
          Elapsed{" "}
          <b className="text-white tabular-nums">{formatElapsed(elapsed)}</b>
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <NeonButton
          onClick={handleStartPause}
          size="lg"
          variant={running ? "ghost" : "primary"}
          disabled={done}
          sound={false}
        >
          {running ? (
            <>
              <Pause size={18} className="inline mr-1" /> Pause
            </>
          ) : (
            <>
              <Play size={18} className="inline mr-1" />{" "}
              {secsLeft === ROUND_SECONDS && round === 1 ? "Start" : "Resume"}
            </>
          )}
        </NeonButton>
        <NeonButton onClick={handleReset} size="lg" variant="ghost" sound={false}>
          <RotateCcw size={16} className="inline mr-1" /> Reset
        </NeonButton>
      </div>
    </div>
  );
}
