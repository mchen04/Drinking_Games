"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Plus, X, Users, Trash2 } from "lucide-react";
import { usePlayers, type Player } from "@/store/players";
import { NeonButton } from "./NeonButton";
import { cn } from "@/lib/cn";

const SUGGESTED = ["Michael", "Matthew", "Kyle", "Jeremy", "Jet", "Justin", "Tyler"];

/** Roster editor wired to the shared persisted player store. */
export function PlayerSetup({
  accent = "#ff2d95",
  className,
}: {
  accent?: string;
  className?: string;
}) {
  const { players, add, remove, clear } = usePlayers();
  const [name, setName] = useState("");

  const submit = () => {
    add(name);
    setName("");
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="flex items-center gap-2 mb-4 text-white/70">
        <Users size={18} style={{ color: accent }} />
        <span className="font-display text-sm uppercase tracking-[0.2em]">The Squad</span>
        <span className="ml-auto text-xs text-white/40">{players.length} in</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2 mb-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add ${SUGGESTED[players.length % SUGGESTED.length]}…`}
          maxLength={16}
          className="flex-1 glass rounded-2xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
        />
        <NeonButton type="submit" size="md" sound>
          <Plus size={20} />
        </NeonButton>
      </form>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {players.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              onClick={() => remove(p.id)}
              className="group flex items-center gap-2 glass rounded-full pl-3 pr-2 py-1.5"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              <span className="text-sm text-white/90">{p.name}</span>
              <X size={14} className="text-white/30 group-hover:text-white/80" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {players.length > 0 && (
        <button
          onClick={clear}
          className="mt-4 flex items-center gap-1.5 text-xs text-white/30 hover:text-neon-coral transition-colors"
        >
          <Trash2 size={13} /> clear roster
        </button>
      )}
    </div>
  );
}

/**
 * Gate that shows the roster editor until `min` players exist, then renders
 * children with the live player list. The simplest way for a game to require
 * players without re-implementing setup.
 */
export function RequirePlayers({
  min = 2,
  accent = "#ff2d95",
  children,
}: {
  min?: number;
  accent?: string;
  children: (players: Player[]) => ReactNode;
}) {
  const { players } = usePlayers();

  if (players.length < min) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <p className="text-center text-white/60 mb-6 max-w-sm">
          Add at least <span className="text-white font-semibold">{min}</span> players to start.
        </p>
        <PlayerSetup accent={accent} />
      </motion.div>
    );
  }

  return <>{children(players)}</>;
}
