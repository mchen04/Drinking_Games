"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw } from "lucide-react";
import { Die, NeonButton, RequirePlayers, PlayerChip, DrinkCallout } from "@/components/ui";
import type { Player } from "@/store/players";
import { randInt } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { drinkRain } from "@/lib/confetti";
import { scoreRoll, rollLabel, loserIds } from "./rules";
import type { RollResult } from "./rules";

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

export default function MexicoGame() {
  return (
    <RequirePlayers min={2} accent="#b6ff3c">
      {(players) => <Mexico players={players} />}
    </RequirePlayers>
  );
}

// ---------------------------------------------------------------------------
// Main game component
// ---------------------------------------------------------------------------

function Mexico({ players }: { players: Player[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [results, setResults] = useState<RollResult[]>([]);
  const [roundOver, setRoundOver] = useState(false);
  const [losers, setLosers] = useState<Player[]>([]);
  const [round, setRound] = useState(1);

  const { after, clearAll } = useTimeouts();
  const currentPlayer = players[currentIdx];
  // Presentational flag: the resolved roll is the unbeatable "Mexico" (2+1).
  const isMexico = hasRolled && rollLabel(dice[0], dice[1]) === "Mexico!";

  // Determine losers from results
  const computeLosers = useCallback((res: RollResult[]): Player[] => {
    const ids = loserIds(res);
    return players.filter((p) => ids.includes(p.id));
  }, [players]);

  function roll() {
    if (rolling || hasRolled) return;
    setRolling(true);
    sfx.click();

    // Small delay to let die animation play
    const a = randInt(1, 6);
    const b = randInt(1, 6);
    setDice([a, b]);

    clearAll();
    after(650, () => {
      setRolling(false);
      setHasRolled(true);
      sfx.ding();

      // Extra flair for Mexico
      if ((a === 2 && b === 1) || (a === 1 && b === 2)) {
        sfx.win();
      }
    });
  }

  function confirmRoll() {
    if (!hasRolled) return;
    const [a, b] = dice;
    const newResult: RollResult = {
      playerId: currentPlayer.id,
      dice: [a, b],
      score: scoreRoll(a, b),
      label: rollLabel(a, b),
    };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (newResults.length === players.length) {
      // Round complete
      const found = computeLosers(newResults);
      setLosers(found);
      setRoundOver(true);
      sfx.pour();
      after(300, () => drinkRain());
    } else {
      // Advance to next player
      setCurrentIdx((i) => i + 1);
      setDice([1, 1]);
      setHasRolled(false);
      sfx.whoosh();
    }
  }

  function nextRound() {
    clearAll();
    setRound((r) => r + 1);
    setCurrentIdx(0);
    setDice([1, 1]);
    setHasRolled(false);
    setResults([]);
    setRoundOver(false);
    setLosers([]);
    sfx.click();
  }

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-white/50 text-sm text-center mb-2">
        Lowest roll drinks · Mexico beats doubles · doubles beat regular
      </p>

      {/* Round counter */}
      <div className="mb-3 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={round}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="inline-block glass rounded-full px-3 py-1 text-xs text-white/50 uppercase tracking-widest"
          >
            Round {round}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Player turn chips */}
      <motion.div layout className="flex flex-wrap justify-center gap-2 mb-4">
        {players.map((p, i) => {
          const rolled = results.find((r) => r.playerId === p.id);
          return (
            <motion.div layout key={p.id} className="flex flex-col items-center gap-1">
              <PlayerChip
                player={p}
                active={!roundOver && i === currentIdx}
              />
              <AnimatePresence>
                {rolled && (
                  <motion.span
                    initial={{ opacity: 0, y: -6, scale: 0.6 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                    className="text-xs font-semibold"
                    style={{ color: "#b6ff3c" }}
                  >
                    {rolled.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dice area */}
      {!roundOver && (
        <motion.div
          key={`turn-${currentIdx}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="flex flex-col items-center gap-3 sm:gap-4 mb-4"
        >
          <p className="text-white/60 text-sm">
            <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
            &apos;s turn
          </p>

          <motion.div
            className="flex gap-4 sm:gap-5 scale-90 sm:scale-100"
            animate={isMexico ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={isMexico ? { filter: "drop-shadow(0 0 22px #b6ff3c)" } : undefined}
          >
            <Die value={dice[0]} rolling={rolling} size="lg" color="#b6ff3c" />
            <Die value={dice[1]} rolling={rolling} size="lg" color="#b6ff3c" />
          </motion.div>

          {/* Roll label */}
          <div className="h-8 flex items-center">
            <AnimatePresence mode="wait">
              {hasRolled && (
                <motion.p
                  key={`${dice[0]}-${dice[1]}`}
                  initial={{ opacity: 0, scale: 1.6, y: 6 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    ...(isMexico ? { rotate: [0, -4, 4, -2, 0] } : {}),
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 340, damping: 16 }}
                  className="font-display text-xl neon-text"
                  style={{ color: "#b6ff3c" }}
                >
                  {rollLabel(dice[0], dice[1])}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3">
            <NeonButton
              onClick={roll}
              size="lg"
              variant="success"
              disabled={rolling || hasRolled}
            >
              Roll
            </NeonButton>
            <NeonButton
              onClick={confirmRoll}
              size="lg"
              variant="primary"
              disabled={!hasRolled || rolling}
            >
              {currentIdx < players.length - 1 ? "Next player →" : "Finish round"}
            </NeonButton>
          </div>
        </motion.div>
      )}

      {/* Round results */}
      <AnimatePresence>
        {roundOver && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="w-full max-w-md glass-strong rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4"
            style={{ boxShadow: "0 0 50px -10px #b6ff3c55" }}
          >
            <h3 className="font-display text-lg sm:text-xl" style={{ color: "#b6ff3c" }}>
              Round {round} Results
            </h3>

            {/* Scores table */}
            <div className="w-full space-y-1.5">
              {[...results]
                .sort((x, y) => y.score - x.score)
                .map((res, i) => {
                  const player = players.find((p) => p.id === res.playerId);
                  if (!player) return null;
                  const isLoser = losers.some((l) => l.id === player.id);
                  return (
                    <motion.div
                      key={res.playerId}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{
                        opacity: 1,
                        x: isLoser ? [0, -10, 10, -6, 6, 0] : 0,
                      }}
                      transition={{
                        delay: 0.08 * i,
                        type: isLoser ? "tween" : "spring",
                        stiffness: 300,
                        damping: 22,
                        duration: isLoser ? 0.5 : undefined,
                      }}
                      className="flex items-center justify-between glass rounded-2xl px-4 py-1.5"
                      style={isLoser ? { boxShadow: `inset 0 0 0 1.5px #ff5e5b55` } : undefined}
                    >
                      <span className="font-semibold text-sm" style={{ color: player.color }}>
                        {player.name}
                      </span>
                      <motion.span
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.08 * i + 0.1, type: "spring", stiffness: 360, damping: 16 }}
                        className="font-display text-base"
                        style={{ color: isLoser ? "#ff5e5b" : "#b6ff3c" }}
                      >
                        {res.label}
                      </motion.span>
                    </motion.div>
                  );
                })}
            </div>

            {/* Drink callout */}
            <div className="flex flex-col items-center gap-2">
              <DrinkCallout
                text={
                  losers.length === 1
                    ? `${losers[0].name} drinks!`
                    : `${losers.map((l) => l.name).join(" & ")} drink!`
                }
                accent="#ff5e5b"
              />
              {losers.length > 1 && (
                <p className="text-xs text-white/50">Tied lowest — all tied players drink</p>
              )}
            </div>

            <NeonButton onClick={nextRound} size="lg" variant="primary">
              <RotateCcw size={16} className="inline mr-1" /> Next round
            </NeonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
