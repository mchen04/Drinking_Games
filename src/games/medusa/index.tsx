"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout, RequirePlayers } from "@/components/ui";
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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function startCountdown() {
    sfx.whoosh();
    setCount(3);
    setPhase("countdown");

    let c = 3;
    intervalRef.current = setInterval(() => {
      sfx.tick();
      c -= 1;
      setCount(c);
      if (c <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = setTimeout(() => {
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
    setPhase("idle");
    setCount(3);
    setRounds(0);
    setTotalDrinks(0);
  }

  const playerCount = players.length;

  return (
    <div className="flex flex-col items-center min-h-0">
      <GameHeading
        title="Medusa 🐍"
        subtitle={`${playerCount} players · heads down, then look up at someone`}
        accent={ACCENT}
      />

      {/* Stats row */}
      <div className="flex gap-5 mb-6 text-sm text-white/50">
        <span>
          round <b className="text-white">{rounds + 1}</b>
        </span>
        <span>
          drinks poured{" "}
          <b style={{ color: ACCENT }}>{totalDrinks}</b>
        </span>
      </div>

      {/* Main play area */}
      <div className="w-full max-w-sm relative min-h-[22rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="text-7xl select-none"
              >
                😴
              </motion.div>

              <div className="glass-strong rounded-3xl px-6 py-5 text-center max-w-xs w-full"
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
              className="flex flex-col items-center gap-4 w-full"
            >
              {/* Pulsing snake ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="text-4xl select-none mb-2"
              >
                🐍
              </motion.div>

              <p className="text-white/60 text-sm uppercase tracking-widest">
                heads down…
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={count}
                  initial={{ scale: 2.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="font-display select-none"
                  style={{
                    fontSize: "clamp(6rem, 22vw, 9rem)",
                    color: ACCENT,
                    textShadow: `0 0 60px ${ACCENT}, 0 0 120px ${ACCENT}88`,
                    lineHeight: 1,
                  }}
                >
                  {count}
                </motion.div>
              </AnimatePresence>

              {/* Tension bars */}
              <div className="flex gap-1 mt-2">
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
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Flash backdrop */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: ACCENT }}
              />

              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: 2, duration: 0.35 }}
                className="text-6xl select-none"
              >
                👀
              </motion.div>

              <motion.p
                className="font-display uppercase tracking-widest text-center"
                style={{
                  fontSize: "clamp(2.4rem, 10vw, 4rem)",
                  color: "#fff",
                  textShadow: `0 0 40px ${ACCENT}, 0 0 80px ${ACCENT}`,
                  lineHeight: 1.1,
                }}
              >
                HEADS UP!
              </motion.p>

              <p
                className="font-display text-lg uppercase tracking-wider"
                style={{ color: ACCENT }}
              >
                — MEDUSA! —
              </p>

              <p className="text-white/60 text-sm text-center max-w-xs">
                Did anyone lock eyes?
              </p>

              <div className="flex gap-3 flex-wrap justify-center">
                <NeonButton onClick={handleLocked} size="lg" variant="danger">
                  <Eye size={18} className="inline mr-1" />
                  Eyes locked! 🐍
                </NeonButton>
                <NeonButton onClick={handleSafe} size="lg" variant="ghost">
                  <EyeOff size={18} className="inline mr-1" />
                  No eye contact 😅
                </NeonButton>
              </div>
            </motion.div>
          )}

          {/* ── LOCKED ── */}
          {phase === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="text-5xl select-none"
              >
                🐍
              </motion.div>

              <div
                className="glass-strong rounded-3xl px-6 py-5 text-center w-full"
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
              className="flex flex-col items-center gap-5 w-full"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: 2, duration: 0.5, ease: "easeInOut" }}
                className="text-5xl select-none"
              >
                😅
              </motion.div>

              <div className="glass-strong rounded-3xl px-6 py-5 text-center w-full"
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
        className="mt-8 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset game
      </button>
    </div>
  );
}
