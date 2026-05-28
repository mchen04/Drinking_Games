"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/cn";

const ACCENT = "#9d4edd";

const TARGET_OPTIONS = [10, 25, 50, 100] as const;
type Target = (typeof TARGET_OPTIONS)[number];

type Phase = "idle" | "running" | "paused" | "done";

export default function Centurion() {
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
      setTimeout(() => setFlash(false), 900);
      if (n >= t) {
        setPhase("done");
        clearTick();
        setTimeout(() => {
          celebrate();
          sfx.win();
        }, 200);
      }
    },
    [shotControls, clearTick],
  );

  const startTimer = useCallback(
    (fromShot: number, fromElapsed: number, t: Target) => {
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
          completeShotN(localShot, t);
        }
      }, 1000);
    },
    [clearTick, completeShotN],
  );

  // Cleanup on unmount
  useEffect(() => () => clearTick(), [clearTick]);

  function handleStart() {
    if (phase === "idle" || phase === "paused") {
      setPhase("running");
      startTimer(shot, elapsed, target);
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

  // Circular progress ring
  const RING_R = 54;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - circularPct);

  const isRunning = phase === "running";
  const isDone = phase === "done";

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Centurion"
        subtitle="One shot of beer every 60 seconds. Reach the target to earn legend status."
        accent={ACCENT}
      />

      {/* Target selector */}
      <div className="flex gap-2 mb-8 glass rounded-full p-1">
        {TARGET_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => pickTarget(t)}
            disabled={isRunning}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
              target === t ? "text-ink" : "text-white/60",
              target !== t && !isRunning && "hover:text-white",
            )}
            style={target === t ? { background: ACCENT } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main display */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 180, height: 180 }}>
        {/* SVG ring */}
        <svg
          width={180}
          height={180}
          viewBox="0 0 140 140"
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* track */}
          <circle
            cx={70}
            cy={70}
            r={RING_R}
            fill="none"
            strokeWidth={10}
            stroke="rgba(255,255,255,0.08)"
          />
          {/* progress */}
          <circle
            cx={70}
            cy={70}
            r={RING_R}
            fill="none"
            strokeWidth={10}
            stroke={ACCENT}
            strokeDasharray={RING_C}
            strokeDashoffset={ringOffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${ACCENT})`,
              transition: "stroke-dashoffset 0.9s linear",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="relative flex flex-col items-center justify-center gap-0.5">
          <motion.span
            animate={shotControls}
            className="text-5xl leading-none select-none"
            style={{ filter: flash ? `drop-shadow(0 0 12px ${ACCENT})` : undefined }}
          >
            🥃
          </motion.span>
          <span className="font-display text-white font-bold text-xl leading-none mt-1">
            {elapsed}s
          </span>
          <span className="text-white/40 text-xs">next shot</span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="w-full max-w-sm mb-2">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>shots taken</span>
          <span style={{ color: ACCENT }}>
            {shot} / {target}
          </span>
        </div>
        <div className="h-3 glass rounded-full overflow-hidden">
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

      {/* Shot flash callout */}
      <div className="h-14 flex items-center justify-center mb-4 w-full">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl px-6 py-3 text-center"
              style={{ boxShadow: `0 0 48px -10px ${ACCENT}` }}
            >
              <span
                className="font-display text-xl font-bold"
                style={{ color: ACCENT }}
              >
                Centurion! 💯 Legend status.
              </span>
            </motion.div>
          ) : flash ? (
            <motion.div
              key={`shot-${shot}`}
              initial={{ opacity: 0, y: -10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
            >
              <DrinkCallout
                text={`SHOT #${shot} 🥃`}
                accent={ACCENT}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
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
      <p className="mt-6 text-sm text-white/35 text-center">
        {isDone
          ? `You survived ${target} shots in ${target} minutes. Absolute legend.`
          : phase === "paused"
          ? "Paused — tap Resume to continue."
          : phase === "idle"
          ? `Complete ${target} shots, one per minute. Press Start when ready.`
          : `Shot ${shot} complete. Shot ${shot + 1} due in ${60 - elapsed}s.`}
      </p>
    </div>
  );
}
