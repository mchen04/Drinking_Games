"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useState } from "react";
import { Users } from "lucide-react";
import {
  PromptDeck,
  RequirePlayers,
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex flex-col items-center w-full"
    >
      <Instruction />

      <PromptDeck
        items={PROMPTS}
        accent={ACCENT}
        prefix="Most likely to…"
        nextLabel="Next prompt"
        onNext={clearVote}
        footer={footer}
      />
    </motion.div>
  );
}

function Instruction() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT }}
      className="flex items-center justify-center gap-2 max-w-sm w-full mb-3 text-sm text-white/55 text-center"
    >
      <Users size={15} className="shrink-0" style={{ color: ACCENT }} />
      <span>
        On <span className="text-white/80 font-semibold">3 — everyone points</span>.
        Most fingers ={" "}
        <span style={{ color: ACCENT }} className="font-semibold">
          drink.
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
    <div className="mt-4 w-full max-w-xl mx-auto">
      {/* Section label */}
      <p className="text-center text-xs text-white/40 uppercase tracking-widest mb-2.5">
        Who got the most fingers?
      </p>

      {/* Player chips — tap to crown the loser */}
      <motion.div
        className="flex flex-wrap justify-center gap-2"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {players.map((p) => {
          const isLoser = loser?.id === p.id;
          return (
            <motion.button
              key={p.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.9 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              whileTap={{ scale: 0.9 }}
              animate={
                isLoser
                  ? { x: [0, -8, 8, -5, 5, 0] }
                  : { x: 0 }
              }
              onClick={() => {
                if (isLoser) {
                  onClear();
                } else {
                  onVote(p);
                }
              }}
            >
              <PlayerChip player={p} active={isLoser} />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Drink callout — minimal reserved height, callout pops in place */}
      <div className="relative mt-3 flex items-start justify-center min-h-[3.25rem]">
        <AnimatePresence mode="wait">
          {showDrink && loser && (
            <motion.div
              key={loser.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="flex flex-col items-center gap-1"
            >
              <motion.span
                key={`burst-${loser.id}`}
                aria-hidden
                className="absolute -top-1 text-2xl pointer-events-none"
                initial={{ opacity: 0, scale: 0.4, y: 4 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.6, 1.9], y: [-2, -22, -34] }}
                transition={{ duration: 0.9, ease: EASE_OUT }}
              >
                👆
              </motion.span>
              <DrinkCallout text={`${loser.name} drinks!`} accent={ACCENT} />
              <p className="text-xs text-white/40">Tap their name again to undo</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
