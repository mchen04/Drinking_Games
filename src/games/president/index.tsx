"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Shuffle } from "lucide-react";
import { NeonButton, RequirePlayers, GameHeading, PlayerChip, DrinkCallout } from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { celebrate, drinkRain } from "@/lib/confetti";
import { pickRandom } from "@/lib/random";
import { RULES_SECTIONS, PRESIDENT_COMMANDS } from "./data";

const ACCENT = "#18e7ff";

export default function President() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <PresidentGame players={players} />}
    </RequirePlayers>
  );
}

// ─── Role assignment ───────────────────────────────────────────────────────────

type Role = "president" | "vice-president" | "neutral" | "vice-scum" | "scum";

interface PlayerRole {
  player: Player;
  role: Role;
  finishPosition: number;
}

function assignRoles(finishOrder: Player[]): PlayerRole[] {
  const n = finishOrder.length;
  // Vice roles only exist with 4+ players: a 3-player game is President / Neutral / Scum.
  return finishOrder.map((player, i) => {
    let role: Role;
    if (i === 0) role = "president";
    else if (i === 1 && n >= 4) role = "vice-president";
    else if (i === n - 1) role = "scum";
    else if (i === n - 2 && n >= 4) role = "vice-scum";
    else role = "neutral";
    return { player, role, finishPosition: i + 1 };
  });
}

const ROLE_META: Record<Role, { label: string; emoji: string; glow: string; description: string }> = {
  president:      { label: "President",      emoji: "👑", glow: "#ffb627", description: "Commands Scum to drink at will. Receives 2 best cards from Scum." },
  "vice-president": { label: "Vice-President", emoji: "🥈", glow: ACCENT,    description: "Receives 1 best card from Vice-Scum. Can command Vice-Scum." },
  neutral:        { label: "Neutral",        emoji: "🃏", glow: "#9d4edd", description: "No special privileges or penalties. Fair game for social dares." },
  "vice-scum":    { label: "Vice-Scum",      emoji: "😬", glow: "#ff5e5b", description: "Gives 1 best card to Vice-President. Drinks when Vice-President commands." },
  scum:           { label: "Scum",           emoji: "💩", glow: "#ff2d95", description: "Deals & collects cards. Gives 2 best cards to President. Drinks on command." },
};

// ─── Main game component ───────────────────────────────────────────────────────

type Phase = "select" | "reveal";

function PresidentGame({ players }: { players: Player[] }) {
  const [phase, setPhase] = useState<Phase>("select");
  const [finishOrder, setFinishOrder] = useState<Player[]>([]);
  const [roles, setRoles] = useState<PlayerRole[]>([]);
  const [command, setCommand] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const remaining = players.filter((p) => !finishOrder.some((f) => f.id === p.id));

  function tapPlayer(player: Player) {
    if (phase !== "select") return;
    sfx.tick();
    const updated = [...finishOrder, player];
    setFinishOrder(updated);

    if (updated.length === players.length) {
      // All players tapped — reveal roles
      const assigned = assignRoles(updated);
      setRoles(assigned);
      setPhase("reveal");
      setTimeout(() => {
        sfx.win();
        celebrate();
      }, 300);
    }
  }

  function undoLast() {
    if (finishOrder.length === 0) return;
    sfx.click();
    setFinishOrder((prev) => prev.slice(0, -1));
  }

  function newHand() {
    sfx.whoosh();
    setFinishOrder([]);
    setRoles([]);
    setPhase("select");
    setCommand(null);
  }

  function issueCommand() {
    sfx.pour();
    drinkRain();
    setCommand(pickRandom(PRESIDENT_COMMANDS));
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <GameHeading
        title="President & Scum"
        subtitle="Play a hand with real cards, then tap players in finishing order."
        accent={ACCENT}
      />

      {/* How to Play collapsible */}
      <div className="w-full mb-6">
        <button
          onClick={() => { sfx.click(); setRulesOpen((o) => !o); }}
          className="w-full flex items-center justify-between glass rounded-2xl px-4 py-3 text-sm text-white/70 hover:text-white transition-colors"
        >
          <span className="font-semibold">How to Play</span>
          {rulesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {rulesOpen && (
            <motion.div
              key="rules"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl mt-1 px-4 py-4 space-y-3">
                {RULES_SECTIONS.map((s) => (
                  <div key={s.heading}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>
                      {s.heading}
                    </p>
                    <p className="text-sm text-white/70 leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase: select finish order */}
      <AnimatePresence mode="wait">
        {phase === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full flex flex-col items-center gap-4"
          >
            {/* Progress strip */}
            <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
              <span>{finishOrder.length} / {players.length} tapped</span>
              {finishOrder.length > 0 && (
                <button
                  onClick={undoLast}
                  className="flex items-center gap-1 text-xs text-white/30 hover:text-white/70 transition-colors ml-2"
                >
                  <RotateCcw size={12} /> undo
                </button>
              )}
            </div>

            {/* Already-tapped mini list */}
            {finishOrder.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {finishOrder.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs"
                    style={{ borderColor: `${p.color}44` }}
                  >
                    <span className="font-bold text-white/40">#{i + 1}</span>
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/80">{p.name}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Roster of remaining players */}
            <p className="text-white/50 text-sm text-center">
              {remaining.length > 0
                ? "Tap the player who just finished"
                : "All players tapped — revealing roles…"}
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {remaining.map((player) => (
                <motion.button
                  key={player.id}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => tapPlayer(player)}
                  className="flex items-center gap-2.5 rounded-2xl px-5 py-3 font-semibold text-white border transition-colors"
                  style={{
                    background: `${player.color}22`,
                    borderColor: `${player.color}66`,
                    boxShadow: `0 0 18px -6px ${player.color}`,
                  }}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: player.color }} />
                  {player.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Phase: reveal roles */}
        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full flex flex-col items-center gap-4"
          >
            <p className="text-white/50 text-sm text-center mb-2">
              Hand complete — here are the standings
            </p>

            {/* Roles list */}
            <div className="w-full space-y-3">
              {roles.map((pr, i) => {
                const meta = ROLE_META[pr.role];
                return (
                  <motion.div
                    key={pr.player.id}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 280, damping: 22 }}
                    className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{ boxShadow: `0 0 28px -10px ${meta.glow}` }}
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlayerChip player={pr.player} active />
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.glow }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{meta.description}</p>
                    </div>
                    <span className="text-white/25 text-lg font-display shrink-0">#{pr.finishPosition}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Presidential command button */}
            {roles.some((r) => r.role === "president") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: roles.length * 0.1 + 0.3 }}
                className="w-full mt-2"
              >
                <div className="glass rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Presidential Decree</p>
                  <NeonButton onClick={issueCommand} variant="primary" size="md" fullWidth>
                    <Shuffle size={16} className="inline mr-1.5" />
                    Issue Command to Scum
                  </NeonButton>

                  <AnimatePresence mode="wait">
                    {command && (
                      <motion.div
                        key={command}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-3"
                      >
                        <DrinkCallout text={command} accent={ROLE_META.scum.glow} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Next hand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: roles.length * 0.1 + 0.5 }}
            >
              <NeonButton onClick={newHand} variant="ghost" size="lg">
                <RotateCcw size={16} className="inline mr-1.5" />
                New Hand
              </NeonButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
