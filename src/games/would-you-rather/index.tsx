"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTimeouts } from "@/lib/timers";
import { GlassCard, NeonButton, RequirePlayers, DrinkCallout } from "@/components/ui";
import type { Player } from "@/store/players";
import { randInt, createDealer } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { drinkRain, pop } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { DILEMMAS, type Dilemma } from "./data";

const ACCENT = "#ff2d95";

export default function WouldYouRather() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Choice = "a" | "b" | null;

interface RoundState {
  dilemma: Dilemma;
  /** map player id → their choice */
  votes: Record<string, Choice>;
  revealed: boolean;
  /** crowd-split percentage for A side, generated at reveal time */
  splitA: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeOutcome(
  votes: Record<string, Choice>,
  players: Player[],
): { minority: Player[]; majority: "a" | "b" | "tie" } {
  let aCount = 0;
  let bCount = 0;
  for (const p of players) {
    const v = votes[p.id];
    if (v === "a") aCount++;
    else if (v === "b") bCount++;
  }
  if (aCount === bCount) return { minority: players, majority: "tie" };
  const majority = aCount > bCount ? "a" : "b";
  const minority = players.filter((p) => votes[p.id] === (majority === "a" ? "b" : "a"));
  return { minority, majority };
}

// ─── Main Game Component ──────────────────────────────────────────────────────

function Game({ players }: { players: Player[] }) {
  const dealer = useRef(createDealer(DILEMMAS));
  const revealInFlightRef = useRef(false);
  const { after, clearAll } = useTimeouts();

  const [round, setRound] = useState<RoundState>(() => ({
    dilemma: dealer.current.next(),
    votes: {},
    revealed: false,
    splitA: 50,
  }));

  const outcome = round.revealed ? computeOutcome(round.votes, players) : null;

  // How many players haven't voted yet
  const votedCount = players.filter((p) => round.votes[p.id] != null).length;
  const allVoted = votedCount === players.length;

  function vote(playerId: string, choice: "a" | "b") {
    if (round.revealed || round.votes[playerId] != null) return;
    sfx.click();
    setRound((prev) => ({
      ...prev,
      votes: { ...prev.votes, [playerId]: choice },
    }));
  }

  function reveal() {
    if (!allVoted || round.revealed || revealInFlightRef.current) return;
    revealInFlightRef.current = true;
    sfx.ding();
    const splitA = randInt(28, 72);
    // Compute outcome synchronously from current votes before any state update,
    // so the closure inside setTimeout always references the correct dilemma's data.
    const out = computeOutcome(round.votes, players);
    setRound((prev) => ({ ...prev, revealed: true, splitA }));
    // Clear any stale timer before starting a new one.
    clearAll();
    // Small delay so reveal animation can start before confetti.
    after(350, () => {
      revealInFlightRef.current = false;
      if (out.majority === "tie") {
        drinkRain();
      } else {
        pop(0.5, 0.4);
      }
    });
  }

  function nextDilemma() {
    // Cancel any pending reveal confetti for the old dilemma.
    clearAll();
    revealInFlightRef.current = false;
    sfx.whoosh();
    setRound({
      dilemma: dealer.current.next(),
      votes: {},
      revealed: false,
      splitA: 50,
    });
  }

  const { dilemma } = round;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      <p className="text-white/50 text-sm text-center mb-3">
        Everyone votes. Minority drinks. Tied? Everyone sips.
      </p>

      {/* Player vote tracker */}
      <motion.div layout className="flex flex-wrap justify-center gap-1.5 mb-3">
        {players.map((p) => {
          const v = round.votes[p.id];
          return (
            <motion.span
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                v != null ? "text-ink" : "text-white/60 glass",
              )}
              style={
                v != null
                  ? { background: p.color, boxShadow: `0 0 18px -4px ${p.color}` }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: v != null ? "#fff" : p.color }}
              />
              {p.name}
              {v != null && (
                <motion.span
                  key="picked"
                  initial={{ scale: 1.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 16 }}
                  className="font-bold uppercase ml-0.5"
                >
                  {v === "a" ? "A" : "B"}
                </motion.span>
              )}
            </motion.span>
          );
        })}
      </motion.div>

      {/* Dilemma area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={dilemma.a + dilemma.b}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="w-full"
        >
          <DilemmaPanel
            dilemma={dilemma}
            votes={round.votes}
            revealed={round.revealed}
            splitA={round.splitA}
            players={players}
            onVote={vote}
          />
        </motion.div>
      </AnimatePresence>

      {/* Reveal / outcome row */}
      <div className="mt-3 flex flex-col items-center gap-2 w-full">
        <AnimatePresence mode="wait">
          {round.revealed && outcome ? (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <motion.div
                initial={{ x: 0 }}
                animate={
                  outcome.majority === "tie"
                    ? { y: [0, -8, 0, -4, 0] }
                    : { x: [0, -10, 10, -6, 6, 0] }
                }
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.18 }}
              >
                {outcome.majority === "tie" ? (
                  <DrinkCallout text="It's a tie — everyone sips!" accent={ACCENT} />
                ) : (
                  <DrinkCallout
                    text={
                      outcome.minority.length === 1
                        ? `${outcome.minority[0].name} drinks!`
                        : `Minority drinks! (${outcome.minority.map((p) => p.name).join(", ")})`
                    }
                    accent={ACCENT}
                  />
                )}
              </motion.div>
              <NeonButton onClick={nextDilemma} size="lg" variant="primary">
                Next dilemma →
              </NeonButton>
            </motion.div>
          ) : (
            <motion.div
              key="vote-action"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              {allVoted ? (
                <NeonButton onClick={reveal} size="lg" variant="success">
                  Reveal votes!
                </NeonButton>
              ) : (
                <p className="text-white/40 text-sm">
                  {votedCount}/{players.length} voted — tap a panel to choose
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={nextDilemma}
        className="mt-4 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
      >
        <RotateCcw size={13} /> skip dilemma
      </button>
    </div>
  );
}

// ─── Dilemma Panel ────────────────────────────────────────────────────────────

interface DilemmaProps {
  dilemma: Dilemma;
  votes: Record<string, Choice>;
  revealed: boolean;
  splitA: number;
  players: Player[];
  onVote: (playerId: string, choice: "a" | "b") => void;
}

function DilemmaPanel({ dilemma, votes, revealed, splitA, players, onVote }: DilemmaProps) {
  // Current player = first player who hasn't voted yet
  const currentPlayer = players.find((p) => votes[p.id] == null) ?? null;

  const aVoters = players.filter((p) => votes[p.id] === "a");
  const bVoters = players.filter((p) => votes[p.id] === "b");

  const splitB = 100 - splitA;

  return (
    <div className="flex flex-col items-stretch gap-0 w-full">
      {/* Current player indicator */}
      <AnimatePresence mode="wait">
        {!revealed && currentPlayer && (
          <motion.p
            key={currentPlayer.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="text-center text-sm mb-2 font-semibold"
            style={{ color: currentPlayer.color }}
          >
            {currentPlayer.name}, pick one:
          </motion.p>
        )}
      </AnimatePresence>

      {/* Option A */}
      <OptionCard
        label="A"
        text={dilemma.a}
        voters={aVoters}
        revealed={revealed}
        splitPct={splitA}
        disabled={revealed || currentPlayer == null}
        onClick={() => currentPlayer && onVote(currentPlayer.id, "a")}
        accent={ACCENT}
      />

      {/* OR divider */}
      <div className="flex items-center justify-center py-2 z-10">
        <div className="flex-1 h-px bg-white/10" />
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{
            scale: 1,
            rotate: 0,
            textShadow: [
              `0 0 12px ${ACCENT}`,
              `0 0 28px ${ACCENT}`,
              `0 0 12px ${ACCENT}`,
            ],
          }}
          transition={{
            scale: { type: "spring", stiffness: 360, damping: 16 },
            rotate: { type: "spring", stiffness: 360, damping: 16 },
            textShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="mx-4 font-display text-lg sm:text-xl font-black tracking-widest select-none"
          style={{ color: ACCENT }}
        >
          OR
        </motion.span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Option B */}
      <OptionCard
        label="B"
        text={dilemma.b}
        voters={bVoters}
        revealed={revealed}
        splitPct={splitB}
        disabled={revealed || currentPlayer == null}
        onClick={() => currentPlayer && onVote(currentPlayer.id, "b")}
        accent={ACCENT}
      />
    </div>
  );
}

// ─── Individual Option Card ───────────────────────────────────────────────────

interface OptionCardProps {
  label: "A" | "B";
  text: string;
  voters: Player[];
  revealed: boolean;
  splitPct: number;
  disabled: boolean;
  onClick: () => void;
  accent: string;
}

function OptionCard({
  label,
  text,
  voters,
  revealed,
  splitPct,
  disabled,
  onClick,
  accent,
}: OptionCardProps) {
  const hasVoters = voters.length > 0;

  return (
    <GlassCard
      glow={hasVoters ? accent : undefined}
      className={cn(
        "group relative w-full cursor-pointer select-none overflow-hidden",
        "rounded-2xl p-4 sm:p-5",
        disabled && "cursor-default",
        hasVoters && !revealed && "ring-1 ring-white/20",
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.015, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      style={
        hasVoters
          ? { boxShadow: `0 0 0 2px ${accent}66, 0 0 40px -12px ${accent}` }
          : undefined
      }
    >
      {/* Hover sheen sweep (tappable cards only) */}
      {!disabled && <span className="sheen-overlay" aria-hidden />}

      {/* Crowd split bar — only visible after reveal */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            key="bar"
            className="absolute inset-0 origin-left"
            style={{ background: `${accent}22` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: splitPct / 100 }}
            transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.1 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex flex-col gap-2">
        {/* Label + text */}
        <div className="flex items-start gap-3">
          <motion.span
            whileHover={disabled ? {} : { scale: 1.1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: accent, color: "#1a001a" }}
          >
            {label}
          </motion.span>
          <p className="text-white text-base sm:text-lg font-medium leading-snug pt-0.5">
            {text}
          </p>
        </div>

        {/* Voters + crowd split */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {voters.map((p) => (
                <motion.span
                  key={p.id}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  className="text-xs rounded-full px-2 py-0.5 font-semibold"
                  style={{ background: `${p.color}33`, color: p.color, border: `1px solid ${p.color}55` }}
                >
                  {p.name}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {revealed && (
            <motion.span
              key={splitPct}
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}
              className="text-sm font-bold tabular-nums"
              style={{ color: accent }}
            >
              ~{splitPct}%
            </motion.span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
