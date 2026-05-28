"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { RotateCcw, Anchor, Crown, Users } from "lucide-react";
import { Die, NeonButton, RequirePlayers, GameHeading, DrinkCallout, PlayerChip } from "@/components/ui";
import type { Player } from "@/store/players";
import { randInt } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { celebrate, drinkRain } from "@/lib/confetti";

const ACCENT = "#b6ff3c";

// The three required values in order: 6=Ship, 5=Captain, 4=Crew
const REQUIRED: [number, number, number] = [6, 5, 4];
const REQUIRED_LABELS: [string, string, string] = ["Ship", "Captain", "Crew"];
const MAX_ROLLS = 3;

interface TurnResult {
  player: Player;
  cargo: number; // sum of cargo dice; -1 if never got ship+captain+crew
  locked: boolean[]; // which dice were locked
  finalDice: number[];
}

// Given current dice and locked state, auto-lock the next required value in sequence.
// Returns new locked array (immutable).
function autoLock(dice: number[], locked: boolean[]): boolean[] {
  const next = locked.slice();
  // Use countSecured logic inline to determine progress without circular dependency
  let startSeq = 0;
  for (let seqIdx = 0; seqIdx < REQUIRED.length; seqIdx++) {
    const needed = REQUIRED[seqIdx];
    const found = next.findIndex((l, i) => l && dice[i] === needed);
    if (found === -1) break;
    startSeq = seqIdx + 1;
  }
  // Try to lock the next required value(s) in order
  for (let seqIdx = startSeq; seqIdx < REQUIRED.length; seqIdx++) {
    const needed = REQUIRED[seqIdx];
    // Find the first unlocked die with this value
    const dieIdx = dice.findIndex((v, i) => !next[i] && v === needed);
    if (dieIdx === -1) break; // can't lock this one yet, stop
    next[dieIdx] = true;
    // continue to next in sequence
  }
  return next;
}

// How many of [Ship, Captain, Crew] have been locked in sequence?
function countSecured(locked: boolean[], dice: number[]): number {
  let count = 0;
  for (let seqIdx = 0; seqIdx < REQUIRED.length; seqIdx++) {
    const needed = REQUIRED[seqIdx];
    // Find a locked die with this value — we consider "locked for sequence" as
    // any locked die matching the needed value (in priority order)
    const found = locked.findIndex((l, i) => l && dice[i] === needed);
    if (found === -1) break;
    count++;
  }
  return count;
}

function cargoSum(dice: number[], locked: boolean[]): number {
  return dice.reduce((sum, v, i) => (locked[i] ? sum : sum + v), 0);
}

export default function ShipCaptainCrew() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

type Phase = "rolling" | "results";

function Game({ players }: { players: Player[] }) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("rolling");

  // Per-turn rolling state
  const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1]);
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [rollCount, setRollCount] = useState(0);
  const [rolling, setRolling] = useState(false);

  // Accumulated results for the current round
  const [results, setResults] = useState<TurnResult[]>([]);

  const currentPlayer = players[turnIndex % players.length];
  const secured = countSecured(locked, dice);
  const hasAll = secured === 3;
  const cargo = hasAll ? cargoSum(dice, locked) : -1;
  const rollsLeft = MAX_ROLLS - rollCount;
  const canRoll = !rolling && rollCount < MAX_ROLLS && !hasAll;

  function doRoll() {
    if (!canRoll) return;
    setRolling(true);
    sfx.tick();

    // Snapshot turn-level state so closures stay fresh
    const snapLocked = locked;
    const snapSecured = secured;
    const snapTurnIndex = turnIndex;
    const snapResults = results;
    const snapPlayer = currentPlayer;

    // Generate new values only for unlocked dice
    const newDice = dice.map((v, i) => (snapLocked[i] ? v : randInt(1, 6)));
    const newRollCount = rollCount + 1;

    setTimeout(() => {
      // Auto-lock sequence dice
      const newLocked = autoLock(newDice, snapLocked);
      const newSecured = countSecured(newLocked, newDice);
      const nowHasAll = newSecured === 3;

      setDice(newDice);
      setLocked(newLocked);
      setRollCount(newRollCount);
      setRolling(false);

      if (newSecured > snapSecured) {
        sfx.ding();
      } else {
        sfx.flip();
      }

      // Auto-end turn if all 3 locked OR no rolls left
      if (nowHasAll || newRollCount >= MAX_ROLLS) {
        // Short delay then record result
        setTimeout(() => {
          recordTurn(newDice, newLocked, nowHasAll, snapTurnIndex, snapResults, snapPlayer);
        }, 600);
      }
    }, 650);
  }

  function recordTurn(finalDice: number[], finalLocked: boolean[], gotAll: boolean, snapTurnIndex: number, snapResults: TurnResult[], snapPlayer: Player) {
    const finalSecured = countSecured(finalLocked, finalDice);
    const finalHasAll = gotAll && finalSecured === 3;
    const cargoPts = finalHasAll ? cargoSum(finalDice, finalLocked) : -1;

    const result: TurnResult = {
      player: snapPlayer,
      cargo: cargoPts,
      locked: finalLocked,
      finalDice,
    };

    const newResults = [...snapResults, result];

    if (snapTurnIndex + 1 >= players.length) {
      // All players done — show results
      setResults(newResults);
      setPhase("results");
      const validScores = newResults.map((r) => r.cargo).filter((s) => s >= 0);
      if (validScores.length > 0) {
        setTimeout(() => {
          celebrate();
          sfx.win();
        }, 300);
        setTimeout(() => {
          drinkRain();
          sfx.pour();
        }, 900);
      }
    } else {
      // Next player's turn
      setResults(newResults);
      advanceTurn(snapTurnIndex + 1);
    }
  }

  function advanceTurn(nextIndex: number) {
    setTurnIndex(nextIndex);
    setDice([1, 1, 1, 1, 1]);
    setLocked([false, false, false, false, false]);
    setRollCount(0);
    setRolling(false);
  }

  function nextRound() {
    setRound((r) => r + 1);
    setTurnIndex(0);
    setPhase("rolling");
    setResults([]);
    setDice([1, 1, 1, 1, 1]);
    setLocked([false, false, false, false, false]);
    setRollCount(0);
    setRolling(false);
    sfx.click();
  }

  // Results phase logic — treat no-ship (cargo=-1) as effective score 0 for comparisons
  let winnerResult: TurnResult | null = null;
  let loserResult: TurnResult | null = null;
  if (phase === "results" && results.length > 0) {
    const effectiveScore = (r: TurnResult) => (r.cargo >= 0 ? r.cargo : 0);
    const maxScore = Math.max(...results.map(effectiveScore));
    const minScore = Math.min(...results.map(effectiveScore));
    if (maxScore > 0 || results.some((r) => r.cargo >= 0)) {
      winnerResult = results.find((r) => effectiveScore(r) === maxScore) ?? null;
      // Only a loser if scores differ
      if (minScore < maxScore) {
        loserResult = results.find((r) => effectiveScore(r) === minScore) ?? null;
      }
    }
  }

  if (phase === "results") {
    return <ResultsView results={results} winner={winnerResult} loser={loserResult} round={round} onNextRound={nextRound} players={players} />;
  }

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Ship, Captain, Crew"
        subtitle={`Round ${round} · Roll up to 3 times to lock 6→5→4 in order`}
        accent={ACCENT}
      />

      {/* Player chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip key={p.id} player={p} active={i === turnIndex % players.length} />
        ))}
      </div>

      {/* Turn header */}
      <motion.p
        key={currentPlayer.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white/60 mb-2 text-sm"
      >
        <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>&apos;s turn
        {rollCount > 0 && (
          <span className="ml-2 text-white/40">· roll {rollCount}/{MAX_ROLLS}</span>
        )}
      </motion.p>

      {/* Sequence indicator */}
      <div className="flex gap-3 mb-6">
        {REQUIRED.map((val, idx) => {
          const isLocked = secured > idx;
          return (
            <motion.div
              key={val}
              animate={isLocked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                style={
                  isLocked
                    ? { background: ACCENT, color: "#0a0a0a", boxShadow: `0 0 16px -4px ${ACCENT}` }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }
                }
              >
                {val}
              </span>
              <span className="text-[10px]" style={{ color: isLocked ? ACCENT : "rgba(255,255,255,0.3)" }}>
                {REQUIRED_LABELS[idx]}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* 5 Dice */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {dice.map((v, i) => {
          const isLocked = locked[i];
          // Determine label for locked dice
          const seqIdx = REQUIRED.indexOf(v);
          const isSeqLocked = isLocked && seqIdx >= 0 && countSecured(locked, dice) > seqIdx;
          const isCargo = isLocked && !isSeqLocked;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Die
                value={v}
                rolling={rolling && !isLocked}
                size="md"
                color={isLocked ? ACCENT : "rgba(255,255,255,0.4)"}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wide h-3">
                {isSeqLocked && (
                  <span style={{ color: ACCENT }}>{REQUIRED_LABELS[seqIdx]}</span>
                )}
                {isCargo && (
                  <span className="text-white/40">cargo</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cargo display */}
      <AnimatePresence>
        {hasAll && cargo >= 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 px-6 py-3 glass-strong rounded-2xl text-center"
            style={{ boxShadow: `0 0 30px -8px ${ACCENT}` }}
          >
            <span className="text-white/50 text-sm">Cargo</span>
            <p className="font-display text-4xl font-bold" style={{ color: ACCENT }}>{cargo}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No-score indicator */}
      <AnimatePresence>
        {rollCount >= MAX_ROLLS && !hasAll && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 px-4 py-2 glass rounded-2xl text-white/50 text-sm text-center"
          >
            No ship secured — 0 points this round
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roll button */}
      <div className="flex gap-3">
        <NeonButton
          onClick={doRoll}
          size="lg"
          variant="success"
          disabled={!canRoll}
        >
          {rollCount === 0 ? "Roll dice" : rollsLeft > 0 ? `Roll again (${rollsLeft} left)` : "No rolls left"}
        </NeonButton>
      </div>

      {/* Rolls left hint */}
      {rollCount === 0 && (
        <p className="mt-3 text-white/30 text-xs">Up to {MAX_ROLLS} rolls per turn</p>
      )}

      {/* Progress: who has gone */}
      {results.length > 0 && (
        <div className="mt-6 glass rounded-2xl p-4 w-full max-w-sm">
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Scores so far</p>
          {results.map((r) => (
            <div key={r.player.id} className="flex justify-between items-center py-1">
              <span className="text-sm" style={{ color: r.player.color }}>{r.player.name}</span>
              <span className="text-sm text-white/70 font-mono">
                {r.cargo >= 0 ? r.cargo : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsView({
  results,
  winner,
  loser,
  round,
  onNextRound,
  players,
}: {
  results: TurnResult[];
  winner: TurnResult | null;
  loser: TurnResult | null;
  round: number;
  onNextRound: () => void;
  players: Player[];
}) {
  const allNoScore = results.every((r) => r.cargo < 0);
  const allTied = !allNoScore && winner !== null && loser === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full"
    >
      <GameHeading
        title={`Round ${round} Results`}
        subtitle={allNoScore ? "Nobody secured their ship!" : allTied ? "It's a tie — everyone safe!" : ""}
        accent={ACCENT}
      />

      {/* Scores table */}
      <div className="glass-strong rounded-2xl p-4 w-full max-w-sm mb-6">
        {results.map((r) => {
          const isWinner = winner?.player.id === r.player.id;
          const isLoser = loser?.player.id === r.player.id;
          return (
            <motion.div
              key={r.player.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2">
                {isWinner && <Crown size={14} style={{ color: ACCENT }} />}
                {isLoser && <Anchor size={14} className="text-neon-coral" />}
                <span className="text-sm font-semibold" style={{ color: r.player.color }}>
                  {r.player.name}
                </span>
              </div>
              <span
                className="font-mono font-bold text-lg"
                style={{ color: isWinner ? ACCENT : isLoser ? "#ff5e5b" : "rgba(255,255,255,0.6)" }}
              >
                {r.cargo >= 0 ? r.cargo : "—"}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 text-center glass-strong rounded-2xl px-6 py-4"
            style={{ boxShadow: `0 0 40px -10px ${ACCENT}` }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown size={18} style={{ color: ACCENT }} />
              <span className="font-display text-lg" style={{ color: ACCENT }}>
                {winner.player.name} wins!
              </span>
            </div>
            <p className="text-white/50 text-sm">Cargo score: <b className="text-white">{winner.cargo}</b></p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drink callout for loser */}
      <AnimatePresence>
        {loser && (
          <motion.div
            key="loser"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col items-center gap-2"
          >
            <DrinkCallout text={`${loser.player.name} drinks! (lowest score)`} accent={loser.player.color} />
          </motion.div>
        )}
        {allNoScore && (
          <motion.div
            key="noship"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <DrinkCallout text="Everyone drinks — no one got the ship!" accent="#ff5e5b" />
          </motion.div>
        )}
        {allTied && (
          <motion.div
            key="tied"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <DrinkCallout text="Tie — re-roll to settle it!" accent={ACCENT} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player chips recap */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p) => (
          <PlayerChip key={p.id} player={p} active={false} />
        ))}
      </div>

      <NeonButton onClick={onNextRound} size="lg" variant="primary">
        <Users size={18} className="inline mr-2" /> Next Round
      </NeonButton>

      <button
        onClick={onNextRound}
        className="mt-4 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new round
      </button>
    </motion.div>
  );
}
