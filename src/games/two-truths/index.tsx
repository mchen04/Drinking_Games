"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, RotateCcw } from "lucide-react";
import { CircleProgress, DrinkCallout, NeonButton, PlayerChip, RequirePlayers } from "@/components/ui";
import type { Player } from "@/store/players";
import { drinkRain, pop } from "@/lib/confetti";
import { sfx } from "@/lib/sound";
import { IDEA_PROMPTS } from "./data";

const ACCENT = "#ff2d95";
const TIMER_SECONDS = 30;

export default function TwoTruthsGame() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <TwoTruths players={players} />}
    </RequirePlayers>
  );
}

type Outcome = "liar" | "group" | null;

function TwoTruths({ players }: { players: Player[] }) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  const currentPlayer = players[turnIndex % players.length];

  // Drive the interval from an effect keyed on timerActive + turnIndex so React
  // owns the full lifecycle: the previous interval is always cleared before a new
  // one starts, and it's cleared on unmount or when the turn advances.
  useEffect(() => {
    if (!timerActive) return;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setTimerActive(false);
          sfx.buzz();
          return 0;
        }
        if (t <= 6) sfx.tick();
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [timerActive, turnIndex]);

  function startTimer() {
    if (timerActive) return;
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(true);
    sfx.click();
  }

  function resetTimer() {
    setTimerActive(false);
    setTimeLeft(TIMER_SECONDS);
  }

  function handleOutcome(result: "liar" | "group") {
    if (result === "liar") {
      sfx.pour();
      drinkRain();
    } else {
      sfx.buzz();
      pop(0.5, 0.5);
    }
    setOutcome(result);
    setIdeasOpen(false);
  }

  function nextPlayer() {
    resetTimer();
    setOutcome(null);
    setIdeasOpen(false);
    setTurnIndex((i) => i + 1);
    sfx.whoosh();
  }

  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      <p className="text-white/50 text-sm text-center mb-3">
        Tell two truths and one lie — can the group spot it?
      </p>

      {/* Player chips row */}
      <motion.div layout className="flex flex-wrap justify-center gap-2 mb-3">
        {players.map((p, i) => (
          <motion.div key={p.id} layout transition={{ type: "spring", stiffness: 320, damping: 26 }}>
            <PlayerChip
              player={p}
              active={i === turnIndex % players.length}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Main prompt card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPlayer.id + String(turnIndex)}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="glass-strong rounded-3xl p-4 sm:p-5 w-full mb-3 text-center"
          style={{ boxShadow: `0 0 44px -12px ${ACCENT}` }}
        >
          <motion.p
            className="text-white/55 text-xs sm:text-sm mb-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
          >
            It&apos;s
          </motion.p>
          <motion.p
            className="font-display text-2xl sm:text-3xl mb-1"
            style={{ color: currentPlayer.color }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 340, damping: 18, delay: 0.1 }}
          >
            {currentPlayer.name}
          </motion.p>
          <motion.p
            className="text-white/55 text-xs sm:text-sm mb-3 sm:mb-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, ease: EASE_OUT }}
          >
            Tell the group <span className="text-white font-semibold">two truths</span> and{" "}
            <span style={{ color: ACCENT }} className="font-semibold">one lie</span>.
          </motion.p>

          {/* Timer ring */}
          <div className="flex flex-col items-center gap-2.5">
            <CircleProgress
              fraction={timerPercent / 100}
              size={60}
              stroke={4}
              color={timeLeft <= 5 ? "#ff5e5b" : ACCENT}
              tween={0.9}
            >
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.4, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="text-lg font-display tabular-nums"
                style={{ color: timeLeft <= 5 ? "#ff5e5b" : "rgba(255,255,255,0.8)" }}
              >
                {timeLeft}
              </motion.span>
            </CircleProgress>

            {!timerActive && timeLeft === TIMER_SECONDS ? (
              <NeonButton onClick={startTimer} size="sm" variant="ghost">
                Start 30s timer
              </NeonButton>
            ) : timerActive ? (
              <button
                onClick={resetTimer}
                className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={12} /> reset
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={12} /> restart
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Need ideas expandable */}
      <div className="w-full mb-3">
        <button
          onClick={() => {
            sfx.click();
            setIdeasOpen((o) => !o);
          }}
          className="w-full flex items-center justify-between gap-2 glass rounded-2xl px-4 py-3 text-white/60 hover:text-white/90 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb size={16} style={{ color: ACCENT }} />
            Need ideas?
          </span>
          {ideasOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {ideasOpen && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-b-2xl px-4 pt-3 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-0.5">
                {IDEA_PROMPTS.map((prompt, i) => (
                  <p key={i} className="text-xs text-white/55 leading-snug">
                    • {prompt}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Outcome or action buttons */}
      <AnimatePresence mode="wait">
        {outcome === null ? (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col sm:flex-row gap-3 w-full"
          >
            <NeonButton
              onClick={() => handleOutcome("liar")}
              size="lg"
              variant="danger"
              className="flex-1"
            >
              Group caught the lie →{" "}
              <span
                className="font-bold truncate max-w-[100px] inline-block align-bottom"
                style={{ color: currentPlayer.color }}
              >
                {currentPlayer.name}
              </span>{" "}
              drinks
            </NeonButton>
            <NeonButton
              onClick={() => handleOutcome("group")}
              size="lg"
              variant="primary"
              className="flex-1"
            >
              Fooled everyone → group drinks
            </NeonButton>
          </motion.div>
        ) : (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <motion.div
              key={outcome}
              animate={
                outcome === "liar"
                  ? { x: [0, -10, 10, -6, 6, 0] }
                  : { scale: [1, 1.14, 0.97, 1] }
              }
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex justify-center"
            >
              {outcome === "liar" ? (
                <DrinkCallout
                  text={`${currentPlayer.name} drinks!`}
                  accent={currentPlayer.color}
                />
              ) : (
                <DrinkCallout
                  text="Everyone drinks!"
                  accent={ACCENT}
                />
              )}
            </motion.div>

            <motion.p
              className="text-white/50 text-sm text-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, ease: EASE_OUT }}
            >
              {outcome === "liar"
                ? "The group saw right through it."
                : `${currentPlayer.name} fooled the whole room!`}
            </motion.p>

            <NeonButton onClick={nextPlayer} size="lg" variant="success">
              Next player →
            </NeonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
