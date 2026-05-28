"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Users } from "lucide-react";
import {
  PromptDeck,
  RequirePlayers,
  GameHeading,
  DrinkCallout,
  PlayerChip,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { drinkRain } from "@/lib/confetti";
import { PROMPTS } from "./data";

const ACCENT = "#ff2d95";

export default function MostLikelyTo() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

function Game({ players }: { players: Player[] }) {
  const [loser, setLoser] = useState<Player | null>(null);
  const [showDrink, setShowDrink] = useState(false);

  function handleVote(player: Player) {
    sfx.pour();
    drinkRain();
    setLoser(player);
    setShowDrink(true);
  }

  function clearVote() {
    setLoser(null);
    setShowDrink(false);
  }

  const footer = (
    <VotePanel
      players={players}
      loser={loser}
      showDrink={showDrink}
      onVote={handleVote}
      onClear={clearVote}
    />
  );

  return (
    <div className="flex flex-col items-center w-full">
      <GameHeading
        title="Most Likely To"
        subtitle="On three — everyone points at the most likely person. Most fingers = drink!"
        accent={ACCENT}
      />

      <Instruction />

      <PromptDeck
        items={PROMPTS}
        accent={ACCENT}
        prefix="Most likely to…"
        nextLabel="Next prompt"
        onNext={clearVote}
        footer={footer}
      />
    </div>
  );
}

function Instruction() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl px-4 py-3 flex items-start gap-3 max-w-sm w-full mb-6 text-sm text-white/70"
      style={{ boxShadow: `0 0 24px -10px ${ACCENT}` }}
    >
      <Users size={16} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
      <span>
        Read the prompt aloud. On{" "}
        <span className="text-white font-semibold">3 — everyone points</span> at
        who fits best. Most fingers pointed wins the shame.{" "}
        <span style={{ color: ACCENT }} className="font-semibold">
          That person drinks.
        </span>
      </span>
    </motion.div>
  );
}

interface VotePanelProps {
  players: Player[];
  loser: Player | null;
  showDrink: boolean;
  onVote: (player: Player) => void;
  onClear: () => void;
}

function VotePanel({ players, loser, showDrink, onVote, onClear }: VotePanelProps) {
  return (
    <div className="mt-6 w-full max-w-xl mx-auto">
      {/* Section label */}
      <p className="text-center text-xs text-white/40 uppercase tracking-widest mb-3">
        Who got the most fingers?
      </p>

      {/* Player chips — tap to crown the loser */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              if (loser?.id === p.id) {
                onClear();
              } else {
                onVote(p);
              }
            }}
            className="transition-transform active:scale-95"
          >
            <PlayerChip player={p} active={loser?.id === p.id} />
          </button>
        ))}
      </div>

      {/* Drink callout */}
      <div className="min-h-[4rem] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showDrink && loser && (
            <motion.div
              key={loser.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              <DrinkCallout
                text={`${loser.name} drinks! 👆`}
                accent={ACCENT}
              />
              <p className="text-xs text-white/40">
                Tap their name again to undo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
