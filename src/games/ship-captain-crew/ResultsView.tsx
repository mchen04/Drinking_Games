"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Anchor, Crown, Users } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout, PlayerChip } from "@/components/ui";
import type { Player } from "@/store/players";
import { ACCENT } from "./types";
import type { TurnResult } from "./types";

interface ResultsViewProps {
  results: TurnResult[];
  winner: TurnResult | null;
  loser: TurnResult | null;
  round: number;
  onNextRound: () => void;
  players: Player[];
}

export function ResultsView({
  results,
  winner,
  loser,
  round,
  onNextRound,
  players,
}: ResultsViewProps) {
  const allNoScore = results.every((r) => r.cargo < 0);
  const allTied = !allNoScore && winner !== null && loser === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center w-full"
    >
      <GameHeading
        title={`Round ${round} Results`}
        subtitle={allNoScore ? "Nobody secured their ship!" : allTied ? "It's a tie — everyone safe!" : ""}
        accent={ACCENT}
      />

      {/* Scores table */}
      <div className="glass-strong rounded-2xl px-4 py-3 w-full max-w-sm mb-3">
        {results.map((r, i) => {
          const isWinner = winner?.player.id === r.player.id;
          const isLoser = loser?.player.id === r.player.id;
          return (
            <motion.div
              key={r.player.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 320, damping: 24 }}
              className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2">
                {isWinner && <Crown size={14} style={{ color: ACCENT }} />}
                {isLoser && <Anchor size={14} className="text-neon-coral" />}
                <span className="text-sm font-semibold" style={{ color: r.player.color }}>
                  {r.player.name}
                </span>
              </div>
              <motion.span
                key={r.cargo}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * i + 0.08, type: "spring", stiffness: 340, damping: 16 }}
                className="font-mono font-bold text-lg"
                style={{ color: isWinner ? ACCENT : isLoser ? "#ff5e5b" : "rgba(255,255,255,0.6)" }}
              >
                {r.cargo >= 0 ? r.cargo : "—"}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: [10, -4, 0] }}
            transition={{ type: "spring", stiffness: 280, damping: 16 }}
            className="mb-3 text-center glass-strong rounded-2xl px-6 py-3"
            style={{ boxShadow: `0 0 40px -10px ${ACCENT}` }}
          >
            <div className="flex items-center justify-center gap-2 mb-0.5">
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
            className="mb-3 flex flex-col items-center gap-2"
          >
            <DrinkCallout text={`${loser.player.name} drinks! (lowest score)`} accent={loser.player.color} />
          </motion.div>
        )}
        {allNoScore && (
          <motion.div
            key="noship"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <DrinkCallout text="Everyone drinks — no one got the ship!" accent="#ff5e5b" />
          </motion.div>
        )}
        {allTied && (
          <motion.div
            key="tied"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <DrinkCallout text="Tie — re-roll to settle it!" accent={ACCENT} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player chips recap */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {players.map((p) => (
          <PlayerChip key={p.id} player={p} active={false} />
        ))}
      </div>

      <NeonButton onClick={onNextRound} size="lg" variant="primary">
        <Users size={18} className="inline mr-2" /> Next Round
      </NeonButton>

      <button
        onClick={onNextRound}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new round
      </button>
    </motion.div>
  );
}
