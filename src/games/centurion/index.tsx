"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { NeonButton, DrinkCallout } from "@/components/ui";
import { CircleProgress } from "@/components/ui/CircleProgress";
import { sfx } from "@/lib/sound";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { useTimeouts } from "@/lib/timers";

const ACCENT = "#9d4edd";

const TARGET_OPTIONS = [10, 25, 50, 100] as const;
type Target = (typeof TARGET_OPTIONS)[number];

type Phase = "idle" | "running" | "paused" | "done";

export default function Centurion() {
  const { after, clearAll } = useTimeouts();
  const [target, setTarget] = useState<Target>(100);
  const [phase, setPhase] = useState<Phase>("idle");
  const [shot, setShot] = useState(0);
  // seconds elapsed within the current 60-second window (0–59)
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shotControls = useAnimationControls();

  // Derived
  const overallPct = (shot / target) * 100;
  const circularPct = elapsed / 60;

  // Latest-ref: always holds current shot + target so the interval tick
  // never closes over stale values regardless of when completeShotN was created.
  const stateRef = useRef({ shot, target });
  useEffect(() => {
    stateRef.current = { shot, target };
  }, [shot, target]);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const completeShotN = useCallback(
    (n: number, t: Target) => {
      sfx.ding();
      setShot(n);
      setElapsed(0);
      setFlash(true);
      void shotControls.start({ scale: [1, 1.4, 1], transition: { duration: 0.35 } });
      after(900, () => setFlash(false));
      if (n >= t) {
        setPhase("done");
        clearTick();
        after(200, () => {
          celebrate();
          sfx.win();
        });
      }
    },
    [shotControls, clearTick, after],
  );

  // Keep a latest-ref to completeShotN so the interval callback always calls
  // the most-recent version without being recreated itself.
  const completeShotNRef = useRef(completeShotN);
  useEffect(() => {
    completeShotNRef.current = completeShotN;
  }, [completeShotN]);

  const startTimer = useCallback(
    (fromShot: number, fromElapsed: number) => {
      clearTick();
      let localShot = fromShot;
      let localElapsed = fromElapsed;
      intervalRef.current = setInterval(() => {
        localElapsed += 1;
        setElapsed(localElapsed);
        sfx.tick();
        if (localElapsed >= 60) {
          localShot += 1;
          localElapsed = 0;
          // Read target from the latest-ref so this tick never uses a stale value.
          completeShotNRef.current(localShot, stateRef.current.target);
        }
      }, 1000);
    },
    [clearTick],
  );

  // Cleanup on unmount
  useEffect(() => () => clearTick(), [clearTick]);

  function handleStart() {
    if (phase === "idle" || phase === "paused") {
      setPhase("running");
      startTimer(shot, elapsed);
    }
  }

  function handlePause() {
    if (phase === "running") {
      clearTick();
      setPhase("paused");
    }
  }

  function handleReset() {
    clearTick();
    clearAll();
    setPhase("idle");
    setShot(0);
    setElapsed(0);
    setFlash(false);
  }

  // When target changes while idle, just reset
  function pickTarget(t: Target) {
    if (phase !== "idle") handleReset();
    setTarget(t);
  }

  const isRunning = phase === "running";
  const isDone = phase === "done";

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      <p className="text-white/50 text-sm text-center mb-3">
        One shot of beer every 60 seconds. Reach the target to earn legend status.
      </p>

      {/* Target selector */}
      <div className="flex gap-1.5 mb-3 glass rounded-full p-1">
        {TARGET_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => pickTarget(t)}
            disabled={isRunning}
            className={cn(
              "relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
              target === t ? "text-ink" : "text-white/60",
              target !== t && !isRunning && "hover:text-white",
            )}
          >
            {target === t && (
              <motion.span
                layoutId="centurion-target-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: ACCENT }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {/* Main display — ring scales down for short landscape viewports */}
      <div className="relative scale-[0.82] sm:scale-100 mb-2 sm:mb-3">
        <CircleProgress
          fraction={circularPct}
          size={160}
          stroke={10}
          color={ACCENT}
          trackColor="rgba(255,255,255,0.08)"
          tween={0.9}
        >
          <div className="flex flex-col items-center justify-center gap-0.5">
            <motion.span
              animate={shotControls}
              className="text-4xl sm:text-5xl leading-none select-none"
              style={{ filter: flash ? `drop-shadow(0 0 14px ${ACCENT})` : undefined }}
            >
              🥃
            </motion.span>
            <span className="font-display text-white font-bold text-xl leading-none mt-1 tabular-nums">
              {elapsed}s
            </span>
            <span className="text-white/40 text-xs">next shot</span>
          </div>
        </CircleProgress>

        {/* Milestone flare — overlaid on the ring, no reserved height */}
        <AnimatePresence>
          {flash && !isDone && (
            <motion.span
              key={`flare-${shot}`}
              className="pointer-events-none absolute inset-0 rounded-full"
              initial={{ opacity: 0.7, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
              style={{ boxShadow: `0 0 40px 8px ${ACCENT}` }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Overall progress bar */}
      <div className="w-full max-w-sm mb-2">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>shots taken</span>
          <span style={{ color: ACCENT }}>
            <motion.span
              key={shot}
              initial={{ scale: 1.5, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="inline-block font-bold tabular-nums"
            >
              {shot}
            </motion.span>
            {" "}/ {target}
          </span>
        </div>
        <div className="h-2.5 glass rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, #c77dff)` }}
            animate={{ width: `${overallPct}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>0</span>
          <span>{target}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center mt-1">
        {!isRunning ? (
          <NeonButton
            onClick={handleStart}
            size="lg"
            variant="primary"
            disabled={isDone}
          >
            <Play size={18} className="inline mr-1" />
            {phase === "paused" ? "Resume" : "Start"}
          </NeonButton>
        ) : (
          <NeonButton onClick={handlePause} size="lg" variant="ghost">
            <Pause size={18} className="inline mr-1" />
            Pause
          </NeonButton>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Status label */}
      <p className="mt-3 text-sm text-white/35 text-center px-2">
        {isDone
          ? `You survived ${target} shots in ${target} minutes. Absolute legend.`
          : phase === "paused"
          ? "Paused — tap Resume to continue."
          : phase === "idle"
          ? `Complete ${target} shots, one per minute. Press Start when ready.`
          : `Shot ${shot} complete. Shot ${shot + 1} due in ${60 - elapsed}s.`}
      </p>

      {/* Transient callouts — overlaid, never reserve vertical space */}
      <AnimatePresence>
        {isDone ? (
          <motion.div
            key="done"
            className="pointer-events-none fixed inset-x-0 top-[42%] z-30 flex justify-center px-4"
            initial={{ opacity: 0, scale: 0.7, y: -8 }}
            animate={{ opacity: 1, scale: [0.7, 1.08, 1], y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            <span
              className="glass-strong rounded-3xl px-6 py-3 text-center font-display text-xl font-bold"
              style={{ color: ACCENT, boxShadow: `0 0 48px -10px ${ACCENT}` }}
            >
              Centurion! 💯 Legend status.
            </span>
          </motion.div>
        ) : flash ? (
          <motion.div
            key={`shot-${shot}`}
            className="pointer-events-none fixed inset-x-0 top-[38%] z-30 flex justify-center px-4"
            initial={{ opacity: 0, y: -14, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <DrinkCallout text={`SHOT #${shot} 🥃`} accent={ACCENT} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
