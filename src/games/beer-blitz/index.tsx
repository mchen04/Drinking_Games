"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Heart } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#9d4edd";
const MAX_LIVES = 3;
const GLASS_H = 280;          // px — visual height of the fill area
const BAND_SIZE = 0.18;       // fraction of glass height the target band occupies
const INITIAL_SPEED = 14;     // % of glass height per second (fill rate)
const SPEED_STEP = 1.8;       // added to speed each successful round
const MAX_SPEED = 55;

// Band sits in upper-middle portion of the glass (60-78% from top = 22-40% from bottom)
const BAND_TOP_FRAC = 0.60;   // fraction from top of glass
const BAND_BOT_FRAC = BAND_TOP_FRAC + BAND_SIZE;

type Phase = "idle" | "filling" | "result-hit" | "result-miss" | "overflow" | "gameover";

// ─── Component ───────────────────────────────────────────────────────────────

export default function BeerBlitz() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fillPct, setFillPct] = useState(0);       // 0–100 percent full
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [drinkMsg, setDrinkMsg] = useState("Miss! Drink up!");

  const fillRef = useRef(0);          // authoritative fill value for RAF
  const phaseRef = useRef<Phase>("idle");
  const speedRef = useRef(INITIAL_SPEED);
  const rafId = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const pulseControls = useAnimationControls();
  const glassControls = useAnimationControls();

  // Keep refs in sync with state
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // ─── RAF fill loop ──────────────────────────────────────────────────────────

  const startFill = useCallback(() => {
    fillRef.current = 0;
    lastTs.current = null;
    setFillPct(0);

    function frame(ts: number) {
      if (phaseRef.current !== "filling") return;
      if (lastTs.current === null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;  // seconds elapsed
      lastTs.current = ts;

      fillRef.current = Math.min(100, fillRef.current + speedRef.current * dt);
      setFillPct(fillRef.current);

      if (fillRef.current >= 100) {
        // Overflow — player was too slow
        phaseRef.current = "overflow";
        setPhase("overflow");
        sfx.buzz();
        drinkRain();
        setDrinkMsg("OVERFLOW! Take a drink!");
        setLives((l) => {
          const next = l - 1;
          if (next <= 0) {
            setTimeout(() => {
              setPhase("gameover");
              phaseRef.current = "gameover";
            }, 1500);
          } else {
            setTimeout(() => {
              setPhase("idle");
              phaseRef.current = "idle";
              setFillPct(0);
              fillRef.current = 0;
            }, 1600);
          }
          return next;
        });
        return;
      }

      rafId.current = requestAnimationFrame(frame);
    }

    rafId.current = requestAnimationFrame(frame);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────

  function startRound() {
    sfx.whoosh();
    setPhase("filling");
    phaseRef.current = "filling";
    startFill();
  }

  function stopPour() {
    if (phaseRef.current !== "filling") return;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const pct = fillRef.current;
    // Convert fill% (bottom-up) to fraction-from-top for comparison
    const fillFrac = 1 - pct / 100;

    const inBand = fillFrac >= BAND_TOP_FRAC && fillFrac <= BAND_BOT_FRAC;

    if (inBand) {
      sfx.ding();
      pop(0.5, 0.4);
      setPhase("result-hit");
      phaseRef.current = "result-hit";
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
      setTimeout(() => {
        setPhase("idle");
        phaseRef.current = "idle";
        setFillPct(0);
        fillRef.current = 0;
      }, 1200);
    } else {
      sfx.buzz();
      drinkRain();
      setDrinkMsg(pct > (1 - BAND_BOT_FRAC) * 100 ? "Too fast! Drink!" : "Too slow! Drink!");
      setPhase("result-miss");
      phaseRef.current = "result-miss";
      void glassControls.start({
        x: [0, -8, 8, -6, 6, 0],
        transition: { duration: 0.4 },
      });
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) {
          setTimeout(() => {
            setPhase("gameover");
            phaseRef.current = "gameover";
          }, 1600);
        } else {
          setTimeout(() => {
            setPhase("idle");
            phaseRef.current = "idle";
            setFillPct(0);
            fillRef.current = 0;
          }, 1600);
        }
        return next;
      });
    }
  }

  function resetGame() {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    sfx.click();
    fillRef.current = 0;
    lastTs.current = null;
    phaseRef.current = "idle";
    setPhase("idle");
    setFillPct(0);
    setScore(0);
    setLives(MAX_LIVES);
    setSpeed(INITIAL_SPEED);
    speedRef.current = INITIAL_SPEED;
  }

  // ─── Derived display values ─────────────────────────────────────────────────

  // Fill height in px (fills from bottom)
  const fillHeightPx = (fillPct / 100) * GLASS_H;

  // Band position in px from bottom of glass
  const bandBotPx = (1 - BAND_BOT_FRAC) * GLASS_H;
  const bandTopPx = (1 - BAND_TOP_FRAC) * GLASS_H;
  const bandHeightPx = bandTopPx - bandBotPx;

  const isActive = phase === "filling";
  const isGameOver = phase === "gameover";

  // Liquid color: shifts amber → violet as fill approaches band
  const fillColorStop1 = "#ffb627";
  const fillColorStop2 = ACCENT;

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
            <motion.div animate={glassControls} className="relative">
              {/* Glass shape */}
              <div
                className="relative overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-white/25 glass"
                style={{
                  width: 120,
                  height: GLASS_H,
                  boxShadow: isActive
                    ? `0 0 32px -8px ${ACCENT}80, inset 0 0 0 1px ${ACCENT}30`
                    : "inset 0 0 0 1px #ffffff18",
                  transition: "box-shadow 0.3s",
                }}
              >
                {/* Liquid fill — animates from bottom */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: fillHeightPx,
                    background: `linear-gradient(180deg, ${fillColorStop2}cc, ${fillColorStop1})`,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                  transition={{ duration: 0 }}   // direct RAF update — no spring lag
                />

                {/* Foam on top of liquid */}
                {fillPct > 2 && (
                  <motion.div
                    className="absolute left-0 right-0"
                    style={{
                      bottom: fillHeightPx,
                      height: 8,
                      background: "rgba(255,255,255,0.55)",
                      borderRadius: 6,
                      filter: "blur(2px)",
                    }}
                    transition={{ duration: 0 }}
                  />
                )}

                {/* Target band — drawn from bottom up */}
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    bottom: bandBotPx,
                    height: bandHeightPx,
                    background: `${ACCENT}40`,
                    borderTop: `2px solid ${ACCENT}cc`,
                    borderBottom: `2px solid ${ACCENT}cc`,
                    boxShadow: `inset 0 0 12px ${ACCENT}55`,
                  }}
                />

                {/* Band label */}
                <div
                  className="absolute right-0 left-0 flex justify-center pointer-events-none"
                  style={{
                    bottom: bandBotPx + bandHeightPx / 2 - 8,
                  }}
                >
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: `${ACCENT}dd`, textShadow: `0 0 8px ${ACCENT}` }}
                  >
                    STOP HERE
                  </span>
                </div>

                {/* Overflow flash */}
                <AnimatePresence>
                  {(phase === "overflow") && (
                    <motion.div
                      className="absolute inset-0 rounded-b-3xl rounded-t-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.55, 0] }}
                      transition={{ duration: 0.5 }}
                      style={{ background: "#ff5e5b" }}
                    />
                  )}
                </AnimatePresence>

                {/* Success flash */}
                <AnimatePresence>
                  {phase === "result-hit" && (
                    <motion.div
                      className="absolute inset-0 rounded-b-3xl rounded-t-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.45, 0] }}
                      transition={{ duration: 0.4 }}
                      style={{ background: "#b6ff3c" }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Speed indicator tick marks on the side */}
              <div
                className="absolute top-0 bottom-0 flex flex-col justify-between py-2"
                style={{ left: -24, width: 12 }}
              >
                {[100, 75, 50, 25, 0].map((mark) => (
                  <div key={mark} className="flex items-center gap-1">
                    <div className="w-2 h-px bg-white/20" />
                  </div>
                ))}
              </div>
            </motion.div>

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
