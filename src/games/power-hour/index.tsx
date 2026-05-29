"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { NeonButton, DrinkCallout } from "@/components/ui";
import { useTimeouts } from "@/lib/timers";
import { CircleProgress } from "@/components/ui/CircleProgress";
import { celebrate, drinkRain } from "@/lib/confetti";
import { sfx } from "@/lib/sound";
import { ACCENT as PALETTE_ACCENT } from "@/lib/palette";

const ACCENT = PALETTE_ACCENT.timer; // "#9d4edd"
const URGENT_COLOR = "#ff5e5b";
const ROUND_SECONDS = 60;

const ROUND_OPTIONS = [10, 20, 30, 60] as const;
type RoundOption = (typeof ROUND_OPTIONS)[number];

function formatElapsed(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Presentational only: shrink the ring on short (landscape) viewports so the
 *  whole game fits one screen. Does not affect any timer/round logic. */
function useRingSize(): number {
  const [size, setSize] = useState(200);
  useEffect(() => {
    const compute = () => {
      const short = window.innerHeight < 560 || window.innerWidth < 360;
      setSize(short ? 150 : 200);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return size;
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

  const { after, clearAll } = useTimeouts();

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
        // Power hour complete! — patch ref immediately so any racing tick sees
        // done=true before React re-renders and stateRef.current is reassigned.
        stateRef.current.done = true;
        clearTick();
        setSecsLeft(0);
        setRunning(false);
        setDone(true);
        sfx.win();
        after(200, () => {
          celebrate();
          drinkRain();
        });
      } else {
        sfx.ding();
        setShowDrink(true);
        drinkRain();
        setRound(nextRound);
        setSecsLeft(ROUND_SECONDS);
        after(1800, () => setShowDrink(false));
      }
    }
  }, [after, clearTick]);

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
    clearAll();
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

  // Glow intensity pulses on last 10s
  const isUrgent = secsLeft <= 10 && running && !done;

  const ringSize = useRingSize();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex flex-col items-center"
    >
      <p className="text-white/50 text-sm text-center mb-3 max-w-xs">
        Take a sip of beer every time the bell rings — once per minute for the
        full hour.
      </p>

      {/* Round selector */}
      <AnimatePresence initial={false}>
        {!running && !done && (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="flex items-center gap-2 mb-3 glass rounded-full p-1 overflow-hidden"
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
      </AnimatePresence>

      {/* Progress ring — pulses while counting down, urgent in last 10s */}
      <motion.div
        className="relative mb-3"
        animate={
          isUrgent
            ? { scale: [1, 1.03, 1] }
            : running
              ? { scale: [1, 1.012, 1] }
              : { scale: 1 }
        }
        transition={
          isUrgent
            ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
            : running
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
        }
      >
        <CircleProgress
          fraction={secsLeft / ROUND_SECONDS}
          size={ringSize}
          stroke={ringSize < 200 ? 8 : 10}
          color={isUrgent ? URGENT_COLOR : ACCENT}
          tween={0.5}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 14 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.span
                  className="text-4xl"
                  animate={{ y: [0, -6, 0], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  🏆
                </motion.span>
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
                {/* count-pop: each new second springs in */}
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={secsLeft}
                    initial={{ scale: 1.45, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className={
                      "font-display text-5xl font-bold tabular-nums leading-none " +
                      (isUrgent ? "text-neon-coral" : "text-white")
                    }
                    style={!isUrgent ? { color: ACCENT } : undefined}
                  >
                    {String(secsLeft).padStart(2, "0")}
                  </motion.span>
                </AnimatePresence>
                <span className="text-white/40 text-xs uppercase tracking-widest">
                  seconds
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </CircleProgress>

        {/* Transient overlays — sit on top of the ring so no fixed block is reserved */}
        <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 flex flex-col items-center">
          <AnimatePresence>
            {showDrink && (
              <DrinkCallout key="drink" text="DRINK! 🍺" accent={ACCENT} />
            )}
            {done && (
              <motion.p
                key="complete"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="font-display text-lg sm:text-xl text-white neon-text text-center whitespace-nowrap"
                style={{ color: ACCENT }}
              >
                Power Hour complete!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="flex gap-6 text-sm text-white/50 mt-6 mb-4">
        <span>
          Round{" "}
          <AnimatePresence mode="popLayout">
            <motion.b
              key={Math.min(round, totalRounds)}
              initial={{ scale: 1.5, opacity: 0, color: ACCENT }}
              animate={{ scale: 1, opacity: 1, color: "#ffffff" }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              className="inline-block tabular-nums"
            >
              {Math.min(round, totalRounds)}
            </motion.b>
          </AnimatePresence>
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
    </motion.div>
  );
}
