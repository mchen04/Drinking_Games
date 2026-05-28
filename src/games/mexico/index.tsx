"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { Die, NeonButton, RequirePlayers, GameHeading, PlayerChip, DrinkCallout } from "@/components/ui";
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

  const currentPlayer = players[currentIdx];

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

    setTimeout(() => {
      setRolling(false);
      setHasRolled(true);
      sfx.ding();

      // Extra flair for Mexico
      if ((a === 2 && b === 1) || (a === 1 && b === 2)) {
        sfx.win();
      }
    }, 650);
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
      setTimeout(() => drinkRain(), 300);
    } else {
      // Advance to next player
      setCurrentIdx((i) => i + 1);
      setDice([1, 1]);
      setHasRolled(false);
      sfx.whoosh();
    }
  }

  function nextRound() {
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
    <div className="flex flex-col items-center">
      <GameHeading
        title="Mexico"
        subtitle="Lowest roll drinks · Mexico beats doubles · doubles beat regular"
        accent="#b6ff3c"
      />

      {/* Round counter */}
      <div className="mb-4">
        <span className="glass rounded-full px-3 py-1 text-xs text-white/50 uppercase tracking-widest">
          Round {round}
        </span>
      </div>

      {/* Player turn chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => {
          const rolled = results.find((r) => r.playerId === p.id);
          return (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <PlayerChip
                player={p}
                active={!roundOver && i === currentIdx}
              />
              {rolled && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold"
                  style={{ color: "#b6ff3c" }}
                >
                  {rolled.label}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>

      {/* Dice area */}
      {!roundOver && (
        <motion.div
          key={`turn-${currentIdx}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 mb-8"
        >
          <p className="text-white/60 text-sm">
            <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
            &apos;s turn
          </p>

          <div className="flex gap-5">
            <Die value={dice[0]} rolling={rolling} size="lg" color="#b6ff3c" />
            <Die value={dice[1]} rolling={rolling} size="lg" color="#b6ff3c" />
          </div>

          {/* Roll label */}
          <div className="h-8 flex items-center">
            <AnimatePresence mode="wait">
              {hasRolled && (
                <motion.p
                  key={`${dice[0]}-${dice[1]}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md glass-strong rounded-3xl p-6 flex flex-col items-center gap-5"
            style={{ boxShadow: "0 0 50px -10px #b6ff3c55" }}
          >
            <h3 className="font-display text-xl" style={{ color: "#b6ff3c" }}>
              Round {round} Results
            </h3>

            {/* Scores table */}
            <div className="w-full space-y-2">
              {[...results]
                .sort((x, y) => y.score - x.score)
                .map((res) => {
                  const player = players.find((p) => p.id === res.playerId);
                  if (!player) return null;
                  const isLoser = losers.some((l) => l.id === player.id);
                  return (
                    <motion.div
                      key={res.playerId}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between glass rounded-2xl px-4 py-2"
                      style={isLoser ? { boxShadow: `inset 0 0 0 1.5px #ff5e5b55` } : undefined}
                    >
                      <span className="font-semibold text-sm" style={{ color: player.color }}>
                        {player.name}
                      </span>
                      <span
                        className="font-display text-base"
                        style={{ color: isLoser ? "#ff5e5b" : "#b6ff3c" }}
                      >
                        {res.label}
                      </span>
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
