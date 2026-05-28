"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Heart } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { useBeerFill, type Phase } from "./useBeerFill";
import {
  GlassDisplay,
  ACCENT,
  BAND_BOT_FRAC,
  BAND_TOP_FRAC,
} from "./GlassDisplay";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_LIVES = 3;
const INITIAL_SPEED = 14;   // % of glass height per second
const SPEED_STEP = 1.8;
const MAX_SPEED = 55;

// ─── Component ───────────────────────────────────────────────────────────────

export default function BeerBlitz() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fillPct, setFillPct] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [drinkMsg, setDrinkMsg] = useState("Miss! Drink up!");

  // phaseRef lets RAF callbacks and setTimeout callbacks read the authoritative
  // phase without stale closures, avoiding the need for extra useEffect syncs.
  const phaseRef = useRef<Phase>("idle");
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseControls = useAnimationControls();
  const glassControls = useAnimationControls();

  // Keep phaseRef in sync whenever React commits phase.
  // This is the single sync point — no other place in the file mutates phaseRef.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Clear any pending transition timer on unmount to avoid state updates on
  // an unmounted component.
  useEffect(() => {
    return () => {
      if (pendingTimer.current !== null) clearTimeout(pendingTimer.current);
    };
  }, []);

  // Helper: schedule a phase transition, replacing any existing pending timer.
  const schedulePhase = useCallback((nextPhase: Phase, delayMs: number) => {
    if (pendingTimer.current !== null) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      setPhase(nextPhase);
    }, delayMs);
  }, []);

  // ─── Overflow handler (called by useBeerFill when fill reaches 100) ─────────

  const handleOverflow = useCallback(() => {
    sfx.buzz();
    drinkRain();
    setDrinkMsg("OVERFLOW! Take a drink!");
    setPhase("overflow");
    setFillPct(100);
    setLives((prev) => {
      const next = prev - 1;
      schedulePhase(next <= 0 ? "gameover" : "idle", next <= 0 ? 1500 : 1600);
      return next;
    });
  }, [schedulePhase]);

  // ─── RAF fill hook ───────────────────────────────────────────────────────────

  const { startFill, cancelFill, getFill } = useBeerFill({
    speed,
    onFillChange: setFillPct,
    onOverflow: handleOverflow,
  });

  // Reset fillPct to 0 whenever we return to idle (after result/overflow).
  useEffect(() => {
    if (phase === "idle") setFillPct(0);
  }, [phase]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  function startRound() {
    sfx.whoosh();
    setPhase("filling");
    startFill();
  }

  function stopPour() {
    if (phaseRef.current !== "filling") return;

    cancelFill();

    const pct = getFill();
    // Convert fill% (bottom-up) to fraction-from-top for comparison.
    const fillFrac = 1 - pct / 100;
    const inBand = fillFrac >= BAND_TOP_FRAC && fillFrac <= BAND_BOT_FRAC;

    if (inBand) {
      sfx.ding();
      pop(0.5, 0.4);
      setPhase("result-hit");
      setScore((s) => {
        const next = s + 1;
        setBest((b) => Math.max(b, next));
        return next;
      });
      setSpeed((spd) => Math.min(spd + SPEED_STEP, MAX_SPEED));
      void pulseControls.start({
        scale: [1, 1.12, 1],
        transition: { duration: 0.35, ease: "easeOut" },
      });
      schedulePhase("idle", 1200);
    } else {
      sfx.buzz();
      drinkRain();
      setDrinkMsg(pct > (1 - BAND_BOT_FRAC) * 100 ? "Too fast! Drink!" : "Too slow! Drink!");
      setPhase("result-miss");
      void glassControls.start({
        x: [0, -8, 8, -6, 6, 0],
        transition: { duration: 0.4 },
      });
      setLives((l) => {
        const next = l - 1;
        schedulePhase(next <= 0 ? "gameover" : "idle", 1600);
        return next;
      });
    }
  }

  function resetGame() {
    cancelFill();
    if (pendingTimer.current !== null) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    sfx.click();
    setPhase("idle");
    setFillPct(0);
    setScore(0);
    setLives(MAX_LIVES);
    setSpeed(INITIAL_SPEED);
  }

  // ─── Derived display values ──────────────────────────────────────────────────

  const isGameOver = phase === "gameover";

  return (
    <div className="flex flex-col items-center select-none">
      <GameHeading
        title="Beer Blitz"
        subtitle="Stop the pour inside the purple band — or take a drink!"
        accent={ACCENT}
      />

      {/* Stats row */}
      <div className="flex items-center gap-5 mb-6 text-sm">
        {/* Lives */}
        <div className="flex items-center gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              fill={i < lives ? ACCENT : "transparent"}
              stroke={i < lives ? ACCENT : "#ffffff40"}
              className="transition-all duration-300"
            />
          ))}
        </div>
        <span className="text-white/50">|</span>
        <span className="text-white/60">
          score <b className="text-white">{score}</b>
        </span>
        <span className="text-white/60">
          best{" "}
          <b style={{ color: "#ffb627" }}>{best}</b>
        </span>
      </div>

      {/* Glass + controls */}
      <AnimatePresence mode="wait">
        {isGameOver ? (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-strong rounded-3xl p-8 flex flex-col items-center gap-4 text-center max-w-xs w-full"
            style={{ boxShadow: `0 0 60px -12px ${ACCENT}` }}
          >
            <div className="text-5xl">🍺</div>
            <h3 className="font-display text-3xl neon-text" style={{ color: ACCENT }}>
              Game Over
            </h3>
            <p className="text-white/60 text-sm">
              You survived{" "}
              <span className="text-white font-semibold">{score}</span> round
              {score !== 1 ? "s" : ""}.
              {best > 0 && (
                <>
                  {" "}Best ever:{" "}
                  <span style={{ color: "#ffb627" }} className="font-semibold">
                    {best}
                  </span>
                  .
                </>
              )}
            </p>
            <NeonButton onClick={resetGame} variant="primary" size="lg">
              <RotateCcw size={16} className="inline mr-2" />
              Play Again
            </NeonButton>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 w-full max-w-xs"
          >
            {/* The glass */}
            <GlassDisplay
              fillPct={fillPct}
              phase={phase}
              glassControls={glassControls}
            />

            {/* Speed label */}
            <p className="text-xs text-white/35 -mt-2">
              speed <span style={{ color: ACCENT }}>{Math.round(speed)}%/s</span>
            </p>

            {/* STOP button or feedback */}
            <div className="h-20 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div
                    key="start"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <NeonButton
                      onClick={startRound}
                      variant="primary"
                      size="lg"
                      className="min-w-[160px]"
                    >
                      POUR!
                    </NeonButton>
                  </motion.div>
                )}

                {phase === "filling" && (
                  <motion.div
                    key="stop"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.button
                      onClick={stopPour}
                      animate={pulseControls}
                      whileTap={{ scale: 0.93 }}
                      className="min-w-[160px] px-7 py-4 rounded-2xl font-display text-2xl tracking-wider font-bold text-ink border-2 border-white/20 select-none"
                      style={{
                        background: `linear-gradient(135deg, #b6ff3c, #2de2c0)`,
                        boxShadow: "0 0 40px -8px #b6ff3c",
                      }}
                    >
                      STOP
                    </motion.button>
                  </motion.div>
                )}

                {phase === "result-hit" && (
                  <motion.div
                    key="hit"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <p className="font-display text-xl neon-text" style={{ color: "#b6ff3c" }}>
                      Perfect! +1
                    </p>
                    <p className="text-white/50 text-xs mt-1">Speed up!</p>
                  </motion.div>
                )}

                {(phase === "result-miss" || phase === "overflow") && (
                  <motion.div
                    key="miss"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <DrinkCallout text={drinkMsg} accent="#ff5e5b" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instruction hint */}
            {phase === "idle" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/30 text-center max-w-[200px]"
              >
                Tap POUR to start filling, then STOP it inside the{" "}
                <span style={{ color: ACCENT }}>purple band</span>.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset link */}
      {!isGameOver && (
        <button
          onClick={resetGame}
          className="mt-8 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
        >
          <RotateCcw size={12} /> restart
        </button>
      )}
    </div>
  );
}
