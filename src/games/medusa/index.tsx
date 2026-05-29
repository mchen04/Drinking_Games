"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { NeonButton, DrinkCallout, RequirePlayers } from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { celebrate, drinkRain } from "@/lib/confetti";

const ACCENT = "#ff5e5b";

type Phase = "idle" | "countdown" | "reveal" | "locked" | "safe";

export default function Medusa() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <MedusaGame players={players} />}
    </RequirePlayers>
  );
}

function MedusaGame({ players }: { players: Player[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [rounds, setRounds] = useState(0);
  const [totalDrinks, setTotalDrinks] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous guard — set to true at the top of startCountdown() before any
  // async work so a rapid double-tap cannot pass the guard twice in the same
  // microtask tick (intervalRef.current would still be null on the second call
  // if checked before the setInterval assignment).
  const countdownActiveRef = useRef(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function startCountdown() {
    // Atomically guard against double-start: if a countdown is already in
    // progress, ignore the extra tap entirely.
    if (countdownActiveRef.current) return;
    countdownActiveRef.current = true;

    // Clear any stale timers that might have survived (e.g. from a reset race).
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    sfx.whoosh();
    setCount(3);
    setPhase("countdown");

    let c = 3;
    intervalRef.current = setInterval(() => {
      sfx.tick();
      c -= 1;
      setCount(c);
      if (c <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          countdownActiveRef.current = false;
          sfx.ding();
          setPhase("reveal");
        }, 180);
      }
    }, 900);
  }

  function handleLocked() {
    sfx.buzz();
    drinkRain();
    setPhase("locked");
    setTotalDrinks((d) => d + 2);
  }

  function handleSafe() {
    sfx.click();
    celebrate();
    setPhase("safe");
  }

  function nextRound() {
    setRounds((r) => r + 1);
    setPhase("idle");
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    countdownActiveRef.current = false;
    setPhase("idle");
    setCount(3);
    setRounds(0);
    setTotalDrinks(0);
  }

  const playerCount = players.length;

  return (
    <div className="flex flex-col items-center min-h-0 w-full">
      <p className="text-white/50 text-sm text-center mb-3">
        {playerCount} players · heads down, then look up at someone
      </p>

      {/* Stats row */}
      <div className="flex gap-5 mb-3 text-sm text-white/50">
        <span>
          round{" "}
          <motion.b
            key={rounds}
            initial={{ scale: 1.5, color: ACCENT }}
            animate={{ scale: 1, color: "#ffffff" }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="inline-block text-white"
          >
            {rounds + 1}
          </motion.b>
        </span>
        <span>
          drinks poured{" "}
          <motion.b
            key={totalDrinks}
            initial={{ scale: 1.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
            className="inline-block"
            style={{ color: ACCENT }}
          >
            {totalDrinks}
          </motion.b>
        </span>
      </div>

      {/* Main play area */}
      <div className="w-full max-w-sm relative min-h-[16rem] sm:min-h-[20rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="text-5xl sm:text-7xl select-none"
              >
                😴
              </motion.div>

              <div className="glass-strong rounded-3xl px-5 py-4 text-center max-w-xs w-full"
                style={{ boxShadow: `0 0 40px -14px ${ACCENT}` }}>
                <p className="text-white/80 leading-snug text-sm">
                  Everyone puts their head <b className="text-white">down</b>. On
                  &ldquo;Medusa!&rdquo; you all snap your heads up and stare at{" "}
                  <b className="text-white">one person</b>. If two players lock eyes —
                  both shout{" "}
                  <span style={{ color: ACCENT }} className="font-bold">
                    &ldquo;MEDUSA!&rdquo;
                  </span>{" "}
                  and drink.
                </p>
              </div>

              <NeonButton onClick={startCountdown} size="lg" variant="danger">
                Heads Down 😴
              </NeonButton>
            </motion.div>
          )}

          {/* ── COUNTDOWN ── */}
          {phase === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 w-full relative"
            >
              {/* Tension vignette — pulses harder each tick */}
              <motion.div
                key={`vignette-${count}`}
                initial={{ opacity: 0.55, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.3 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 -m-8 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${ACCENT}55 0%, transparent 65%)`,
                }}
              />

              {/* Pulsing snake ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="text-3xl sm:text-4xl select-none relative"
              >
                🐍
              </motion.div>

              <p className="text-white/60 text-sm uppercase tracking-widest relative">
                heads down…
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={count}
                  initial={{ scale: 2.2, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="font-display select-none relative"
                  style={{
                    fontSize: "clamp(4.5rem, 22vw, 9rem)",
                    color: ACCENT,
                    textShadow: `0 0 60px ${ACCENT}, 0 0 120px ${ACCENT}88`,
                    lineHeight: 1,
                  }}
                >
                  {count}
                </motion.div>
              </AnimatePresence>

              {/* Tension bars */}
              <div className="flex gap-1 mt-1 relative">
                {[3, 2, 1].map((n) => (
                  <motion.div
                    key={n}
                    className="h-1.5 w-8 rounded-full"
                    animate={{
                      background: count <= n ? ACCENT : "rgba(255,255,255,0.12)",
                      boxShadow: count <= n ? `0 0 8px ${ACCENT}` : "none",
                    }}
                    transition={{ duration: 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── REVEAL ── */}
          {phase === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ type: "spring", stiffness: 340, damping: 18 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              {/* Camera-flash backdrop — fast bright pop then fade */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 -m-6 rounded-3xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle, #ffffff 0%, ${ACCENT} 35%, transparent 75%)`,
                }}
              />

              <motion.div
                initial={{ scale: 0.2, rotate: -20 }}
                animate={{ scale: [0.2, 1.25, 1], rotate: [-20, 0, 0] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1], ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-6xl select-none relative"
              >
                👀
              </motion.div>

              <motion.p
                initial={{ scale: 1.8, opacity: 0, letterSpacing: "0.4em" }}
                animate={{ scale: 1, opacity: 1, letterSpacing: "0.1em" }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
                className="font-display uppercase tracking-widest text-center relative"
                style={{
                  fontSize: "clamp(2rem, 10vw, 4rem)",
                  color: "#fff",
                  textShadow: `0 0 40px ${ACCENT}, 0 0 80px ${ACCENT}`,
                  lineHeight: 1.1,
                }}
              >
                HEADS UP!
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0, 1, 0.85, 1], y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="font-display text-lg uppercase tracking-wider relative"
                style={{ color: ACCENT, textShadow: `0 0 18px ${ACCENT}` }}
              >
                — MEDUSA! —
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/60 text-sm text-center max-w-xs relative"
              >
                Did anyone lock eyes?
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 22 }}
                className="flex gap-3 flex-wrap justify-center relative"
              >
                <NeonButton onClick={handleLocked} size="lg" variant="danger">
                  <Eye size={18} className="inline mr-1" />
                  Eyes locked! 🐍
                </NeonButton>
                <NeonButton onClick={handleSafe} size="lg" variant="ghost">
                  <EyeOff size={18} className="inline mr-1" />
                  No eye contact 😅
                </NeonButton>
              </motion.div>
            </motion.div>
          )}

          {/* ── LOCKED ── */}
          {phase === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, x: [0, -10, 10, -6, 6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.18, 1] }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="text-5xl select-none"
              >
                🐍
              </motion.div>

              <div
                className="glass-strong rounded-3xl px-5 py-4 text-center w-full"
                style={{ boxShadow: `0 0 60px -10px ${ACCENT}` }}
              >
                <p
                  className="font-display text-2xl uppercase tracking-wider mb-1"
                  style={{ color: ACCENT, textShadow: `0 0 24px ${ACCENT}` }}
                >
                  Eyes Locked!
                </p>
                <p className="text-white/70 text-sm mb-4">
                  Both players who locked eyes must drink!
                </p>
                <DrinkCallout text="Both drink! 🍺🍺" accent={ACCENT} />
              </div>

              <NeonButton onClick={nextRound} size="md" variant="primary">
                Next Round →
              </NeonButton>
            </motion.div>
          )}

          {/* ── SAFE ── */}
          {phase === "safe" && (
            <motion.div
              key="safe"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <motion.div
                animate={{ y: [0, -18, 0, -8, 0], scale: [1, 1.12, 1, 1.05, 1] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl select-none"
              >
                😅
              </motion.div>

              <div className="glass-strong rounded-3xl px-5 py-4 text-center w-full"
                style={{ boxShadow: "0 0 40px -16px #2de2c0" }}>
                <p className="font-display text-2xl text-white mb-1 uppercase tracking-wider">
                  Safe!
                </p>
                <p className="text-white/60 text-sm">
                  No eye contact — everyone survives this round. For now.
                </p>
              </div>

              <NeonButton onClick={nextRound} size="md" variant="primary">
                Next Round →
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset game
      </button>
    </div>
  );
}
