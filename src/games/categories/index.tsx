"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, Settings } from "lucide-react";
import {
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
  CircleProgress,
} from "@/components/ui";
import { createDealer } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { drinkRain } from "@/lib/confetti";
import type { Player } from "@/store/players";
import { CATEGORIES } from "./data";

const ACCENT = "#ff5e5b";
const DEFAULT_SECONDS = 5;

// ---------------------------------------------------------------------------
// Root — gate on 3+ players
// ---------------------------------------------------------------------------
export default function CategoriesGame() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <Categories players={players} />}
    </RequirePlayers>
  );
}

// ---------------------------------------------------------------------------
// Main game component
// ---------------------------------------------------------------------------
function Categories({ players }: { players: Player[] }) {
  const dealerRef = useRef(createDealer(CATEGORIES));

  const [category, setCategory] = useState<string>(() => dealerRef.current.next());
  const [turnIdx, setTurnIdx] = useState(0);
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [timeLimit, setTimeLimit] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [drinkMsg, setDrinkMsg] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const activePlayer = players[turnIdx % players.length];

  // -----------------------------------------------------------------------
  // Countdown logic
  // -----------------------------------------------------------------------
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearDelay = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setSeconds(timeLimit);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          return 0;
        }
        sfx.tick();
        return s - 1;
      });
    }, 1000);
  }, [clearTimer, timeLimit]);

  // Watch seconds hitting zero while timer is running
  useEffect(() => {
    if (running && seconds === 0) {
      clearTimer();
      setRunning(false);
      sfx.buzz();
      drinkRain();
      setDrinkMsg(`Too slow — ${activePlayer.name}, drink!`);
    }
  }, [running, seconds, clearTimer, activePlayer.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      clearDelay();
    };
  }, [clearTimer, clearDelay]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  function handleGotOne() {
    if (!running) return;
    sfx.tick();
    clearTimer();
    clearDelay();
    setRunning(false);
    setDrinkMsg(null);
    // advance to next player
    const next = turnIdx + 1;
    setTurnIdx(next);
    // slight delay then restart
    delayRef.current = setTimeout(() => {
      delayRef.current = null;
      startTimer();
    }, 300);
  }

  function handleBlanked() {
    clearTimer();
    setRunning(false);
    sfx.buzz();
    drinkRain();
    setDrinkMsg(`${activePlayer.name} blanked — drink!`);
  }

  function handleNewCategory() {
    clearTimer();
    clearDelay();
    setRunning(false);
    setDrinkMsg(null);
    sfx.whoosh();
    setCategory(dealerRef.current.next());
    setTurnIdx(0);
    // small animation delay then autostart
    delayRef.current = setTimeout(() => {
      delayRef.current = null;
      startTimer();
    }, 350);
  }

  function handleStart() {
    setDrinkMsg(null);
    startTimer();
  }

  // -----------------------------------------------------------------------
  // Timer ring geometry
  // -----------------------------------------------------------------------
  const fraction = seconds / timeLimit;
  // Coral ACCENT when there's plenty of time, amber warning in the middle band,
  // back to the coral ACCENT for the urgent final stretch.
  const ringColor =
    fraction > 0.5 ? ACCENT : fraction > 0.25 ? "#ffb627" : ACCENT;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <GameHeading
        title="Categories"
        subtitle="Name something in the category before the timer runs out!"
        accent={ACCENT}
      />

      {/* Player chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turnIdx % players.length}
          />
        ))}
      </div>

      {/* Category card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="glass-strong rounded-3xl p-8 text-center w-full mb-8"
          style={{ boxShadow: `0 0 48px -14px ${ACCENT}` }}
        >
          <p className="text-xs font-display uppercase tracking-[0.22em] text-white/40 mb-3">
            Category
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl text-white leading-tight"
            style={{ textShadow: `0 0 30px ${ACCENT}88` }}
          >
            {category}
          </h2>
          <p className="mt-4 text-sm text-white/50">
            <span style={{ color: activePlayer.color }}>{activePlayer.name}</span>
            &apos;s turn — say something in this category!
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Timer ring + controls row */}
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
        {/* Countdown ring — shared CircleProgress (size=96 → r=44, stroke=8) */}
        <CircleProgress
          fraction={fraction}
          size={96}
          stroke={8}
          color={ringColor}
          tween={0.3}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={seconds}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="font-display text-3xl text-white"
              style={{ textShadow: `0 0 16px ${ringColor}` }}
            >
              {seconds}
            </motion.span>
          </AnimatePresence>
        </CircleProgress>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 items-center sm:items-start">
          {!running && !drinkMsg && (
            <NeonButton onClick={handleStart} size="lg" variant="primary">
              Start Timer ▶
            </NeonButton>
          )}
          {running && (
            <>
              <NeonButton onClick={handleGotOne} size="lg" variant="success">
                Got one ✅
              </NeonButton>
              <NeonButton onClick={handleBlanked} size="lg" variant="danger">
                Blanked 🍺
              </NeonButton>
            </>
          )}
          {drinkMsg && !running && (
            <NeonButton
              onClick={() => {
                setDrinkMsg(null);
              }}
              size="md"
              variant="ghost"
            >
              Dismiss
            </NeonButton>
          )}
        </div>
      </div>

      {/* Drink callout */}
      <div className="min-h-[4rem] flex items-center justify-center mb-4">
        <AnimatePresence>
          {drinkMsg && (
            <motion.div
              key={drinkMsg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DrinkCallout text={drinkMsg} accent={ACCENT} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New category + settings row */}
      <div className="flex items-center gap-4 mt-2">
        <NeonButton onClick={handleNewCategory} size="md" variant="ghost">
          <RotateCcw size={15} className="inline mr-1" /> New category
        </NeonButton>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
        >
          <Settings size={13} /> timer
        </button>
      </div>

      {/* Timer settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden w-full max-w-xs mt-4"
          >
            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs text-white/50 uppercase tracking-widest">
                Timer duration
              </p>
              <div className="flex gap-2 flex-wrap">
                {[3, 5, 7, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      sfx.click();
                      setTimeLimit(s);
                      setSeconds(s);
                      clearTimer();
                      setRunning(false);
                    }}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
                    style={
                      timeLimit === s
                        ? { background: ACCENT, color: "#1a0a00" }
                        : { color: "rgba(255,255,255,0.55)" }
                    }
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
