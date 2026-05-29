"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useState, useCallback } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw, Trophy, Zap } from "lucide-react";
import {
  NeonButton,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { celebrate, drinkRain } from "@/lib/confetti";

const ACCENT = "#ff5e5b";

function isBuzz(n: number): boolean {
  return n % 7 === 0 || String(n).includes("7");
}

export default function BuzzGame() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <Buzz players={players} />}
    </RequirePlayers>
  );
}

type Outcome = "wrong" | "new-record" | "right" | null;

function Buzz({ players }: { players: Player[] }) {
  const { after, clearAll } = useTimeouts();
  const [count, setCount] = useState(1);
  const [turn, setTurn] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [locked, setLocked] = useState(false);
  const [penaltyPlayer, setPenaltyPlayer] = useState<Player | null>(null);

  const activePlayer = players[turn % players.length];
  const buzzExpected = isBuzz(count);

  /** Advance without penalty — correct choice was made. */
  const advanceCount = useCallback(() => {
    sfx.tick();
    setCount((c) => c + 1);
    setTurn((t) => t + 1);
    setOutcome("right");
    after(500, () => {
      setOutcome(null);
      setLocked(false);
    });
  }, [after]);

  /** The wrong button was pressed — penalise and reset. */
  const penalise = useCallback(() => {
    sfx.buzz();
    drinkRain();
    // Snapshot the player who messed up NOW, before the turn advances.
    setPenaltyPlayer(players[turn % players.length]);
    // reached = count - 1 because `count` is the number they failed on,
    // so the group got through count-1 numbers cleanly.
    const reached = count - 1;
    const newRecord = reached > highScore;
    if (newRecord) {
      setHighScore(reached);
      after(350, () => celebrate());
      setOutcome("new-record");
    } else {
      setOutcome("wrong");
    }
    after(1800, () => {
      setCount(1);
      setTurn((t) => t + 1);
      setOutcome(null);
      setLocked(false);
      setPenaltyPlayer(null);
    });
  }, [after, count, highScore, players, turn]);

  const handleSay = useCallback(() => {
    if (locked) return;
    setLocked(true);
    if (buzzExpected) {
      // Should have said BUZZ — wrong!
      penalise();
    } else {
      advanceCount();
    }
  }, [locked, buzzExpected, penalise, advanceCount]);

  const handleBuzz = useCallback(() => {
    if (locked) return;
    setLocked(true);
    if (!buzzExpected) {
      // Should have said the number — wrong!
      penalise();
    } else {
      advanceCount();
    }
  }, [locked, buzzExpected, penalise, advanceCount]);

  function reset() {
    clearAll();
    setCount(1);
    setTurn(0);
    setOutcome(null);
    setLocked(false);
    setPenaltyPlayer(null);
  }

  const isWrong = outcome === "wrong" || outcome === "new-record";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex flex-col items-center w-full"
    >
      <p className="text-white/50 text-sm text-center mb-3">
        Divisible by 7 or contains a 7? Say BUZZ — not the number!
      </p>

      {/* Player rotation chips */}
      <motion.div layout className="flex flex-wrap justify-center gap-2 mb-3">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turn % players.length && !isWrong}
          />
        ))}
      </motion.div>

      {/* Active player label */}
      <AnimatePresence mode="wait">
        {!isWrong ? (
          <motion.p
            key={`say-${turn}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-white/60 text-sm mb-3 h-5"
          >
            <b style={{ color: activePlayer.color }}>{activePlayer.name}</b>
            {" — what do you say?"}
          </motion.p>
        ) : (
          <motion.p
            key="resetting"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-white/60 text-sm mb-3 h-5"
          >
            Resetting to 1…
          </motion.p>
        )}
      </AnimatePresence>

      {/* Big number display — hero. Pulses + glows when a BUZZ is due,
          shakes on a wrong call, flashes a giant BUZZ overlay on reveal. */}
      <motion.div
        animate={
          isWrong
            ? { x: [0, -12, 12, -8, 8, -4, 4, 0] }
            : buzzExpected
              ? { scale: [1, 1.04, 1] }
              : { scale: 1 }
        }
        transition={
          isWrong
            ? { duration: 0.5 }
            : buzzExpected
              ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
        }
        className="relative mb-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 1.5, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="glass-strong rounded-3xl flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40"
            style={{
              boxShadow: buzzExpected ? `0 0 64px -8px ${ACCENT}` : "none",
            }}
          >
            <span
              className="font-display text-5xl sm:text-6xl tabular-nums"
              style={{
                color: buzzExpected ? ACCENT : "white",
                textShadow: buzzExpected ? `0 0 24px ${ACCENT}` : "none",
              }}
            >
              {count}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Giant BUZZ flash overlay on a wrong call */}
        <AnimatePresence>
          {isWrong && (
            <motion.div
              key="buzz-flash"
              initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: -6 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span
                className="font-display text-3xl sm:text-4xl tracking-tight neon-text"
                style={{ color: ACCENT }}
              >
                BUZZ!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-3">
        <NeonButton
          onClick={handleSay}
          size="lg"
          variant="ghost"
          disabled={locked}
        >
          Say {count}
        </NeonButton>
        <NeonButton
          onClick={handleBuzz}
          size="lg"
          variant="primary"
          disabled={locked}
        >
          <Zap size={18} className="inline-block mr-1" /> BUZZ!
        </NeonButton>
      </div>

      {/* Outcome feedback — overlay so it doesn't reserve big fixed height */}
      <div className="relative h-9 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {outcome === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="absolute"
            >
              <DrinkCallout
                text={`${penaltyPlayer?.name} drinks! Back to 1.`}
                accent={ACCENT}
              />
            </motion.div>
          )}
          {outcome === "new-record" && (
            <motion.div
              key="record"
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: [0.8, 1.08, 1], y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              className="absolute"
            >
              <DrinkCallout
                text={`${penaltyPlayer?.name} drinks! New record: ${highScore}`}
                accent="#ffb627"
              />
            </motion.div>
          )}
          {outcome === "right" && (
            <motion.p
              key="right"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: [0.6, 1.15, 1] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 340, damping: 16 }}
              className="absolute font-display text-lg"
              style={{ color: ACCENT }}
            >
              Correct!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mt-1 text-sm text-white/50">
        <span>
          at <b className="text-white">{count}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy size={13} style={{ color: "#ffb627" }} />
          best{" "}
          <AnimatePresence mode="popLayout">
            <motion.b
              key={highScore}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              style={{ color: "#ffb627", display: "inline-block" }}
            >
              {highScore}
            </motion.b>
          </AnimatePresence>
        </span>
      </div>

      {/* Rule legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl px-4 py-2.5 mt-3 max-w-xs w-full text-xs text-white/50 text-center space-y-0.5"
      >
        <p>
          Say{" "}
          <span style={{ color: ACCENT }} className="font-bold">
            BUZZ
          </span>{" "}
          on any{" "}
          <span className="text-white font-semibold">multiple of 7</span> or
          number with a <span className="text-white font-semibold">7</span> in
          it. Wrong?{" "}
          <span style={{ color: ACCENT }} className="font-semibold">
            Drink
          </span>{" "}
          &amp; reset to 1.
        </p>
      </motion.div>

      <button
        onClick={reset}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> restart
      </button>
    </motion.div>
  );
}
