"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw, Trophy, Zap } from "lucide-react";
import {
  NeonButton,
  GameHeading,
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
    });
  }, [after, count, highScore]);

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
  }

  const isWrong = outcome === "wrong" || outcome === "new-record";

  // Capture the drinker at the moment the outcome is set (before turn advances)
  // by reading activePlayer synchronously from the render that set isWrong.
  const drinkerName = activePlayer.name;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Buzz"
        subtitle="Divisible by 7 or contains a 7? Say BUZZ — not the number!"
        accent={ACCENT}
      />

      {/* Player rotation chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turn % players.length && !isWrong}
          />
        ))}
      </div>

      {/* Active player label */}
      <AnimatePresence mode="wait">
        {!isWrong ? (
          <motion.p
            key={`say-${turn}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-white/60 text-sm mb-8"
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
            className="text-white/60 text-sm mb-8"
          >
            Resetting to 1…
          </motion.p>
        )}
      </AnimatePresence>

      {/* Big number display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="glass-strong rounded-3xl flex items-center justify-center mb-8"
          style={{
            width: 160,
            height: 160,
            boxShadow: buzzExpected ? `0 0 64px -10px ${ACCENT}` : "none",
          }}
        >
          <span
            className="font-display text-6xl tabular-nums"
            style={{ color: buzzExpected ? ACCENT : "white" }}
          >
            {count}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-4 mb-6">
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

      {/* Outcome feedback */}
      <div className="h-16 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {outcome === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <DrinkCallout
                text={`${drinkerName} drinks! Back to 1.`}
                accent={ACCENT}
              />
            </motion.div>
          )}
          {outcome === "new-record" && (
            <motion.div
              key="record"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <DrinkCallout
                text={`${drinkerName} drinks! New record: ${highScore}`}
                accent="#ffb627"
              />
            </motion.div>
          )}
          {outcome === "right" && (
            <motion.p
              key="right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-lg"
              style={{ color: ACCENT }}
            >
              Correct!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mt-2 text-sm text-white/50">
        <span>
          at <b className="text-white">{count}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy size={13} style={{ color: "#ffb627" }} />
          best <b style={{ color: "#ffb627" }}>{highScore}</b>
        </span>
      </div>

      {/* Rule legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl px-5 py-4 mt-8 max-w-xs w-full text-xs text-white/50 text-center space-y-1"
      >
        <p className="font-semibold text-white/70 mb-1.5">The Buzz Rule</p>
        <p>
          Say{" "}
          <span style={{ color: ACCENT }} className="font-bold">
            BUZZ
          </span>{" "}
          instead of any number that is:
        </p>
        <p>
          • divisible by <span className="text-white font-semibold">7</span>{" "}
          (7, 14, 21, 28…)
        </p>
        <p>
          • contains the digit <span className="text-white font-semibold">7</span>{" "}
          (7, 17, 27, 37, 70, 71…)
        </p>
        <p className="pt-1.5">
          Wrong answer?{" "}
          <span style={{ color: ACCENT }} className="font-semibold">
            Drink
          </span>{" "}
          and reset to 1.
        </p>
      </motion.div>

      <button
        onClick={reset}
        className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> restart
      </button>
    </div>
  );
}
