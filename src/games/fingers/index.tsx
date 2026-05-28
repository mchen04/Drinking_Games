"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";
import {
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { drinkRain, pop } from "@/lib/confetti";
import { cn } from "@/lib/cn";

const ACCENT = "#ff5e5b";

export default function FingersGame() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <Fingers allPlayers={players} />}
    </RequirePlayers>
  );
}

/* ─── types ─── */

type Phase = "guess" | "secret" | "reveal" | "drink";

interface SecretVote {
  playerId: string;
  inGame: boolean; // true = kept finger IN, false = pulled OUT
}

/* ─── helpers ─── */

function nextGuesserIndex(
  remaining: Player[],
  currentGuesserId: string,
): number {
  const idx = remaining.findIndex((p) => p.id === currentGuesserId);
  // rotate to the next player after the current guesser
  return (idx + 1) % remaining.length;
}

/* ─── main game ─── */

function Fingers({ allPlayers }: { allPlayers: Player[] }) {
  // Players still in the round (not yet eliminated)
  const [remaining, setRemaining] = useState<Player[]>(allPlayers);
  // Index into `remaining` for the current guesser
  const [guesserIdx, setGuesserIdx] = useState(0);
  // Phase
  const [phase, setPhase] = useState<Phase>("guess");
  // Guesser's chosen number
  const [guess, setGuess] = useState<number | null>(null);
  // Secret votes collected so far (only from non-guesser players)
  const [votes, setVotes] = useState<SecretVote[]>([]);
  // Which non-guesser player is currently voting (index into voterList)
  const [voterStep, setVoterStep] = useState(0);
  // Whether the current voter's choice is hidden (just tapped)
  const [choiceMade, setChoiceMade] = useState(false);
  // Chosen in/out for display before moving on
  const [pendingChoice, setPendingChoice] = useState<boolean | null>(null);
  // Reveal computed results
  const [totalIn, setTotalIn] = useState<number | null>(null);
  // The player who must drink (last one standing)
  const [loser, setLoser] = useState<Player | null>(null);

  const guesser = remaining[guesserIdx] ?? remaining[0];
  // All players who vote this round (everyone except guesser)
  const voterList = remaining.filter((p) => p.id !== guesser.id);
  const currentVoter = voterList[voterStep] ?? null;

  /* ── phase transitions ── */

  function startSecretPhase(chosenGuess: number) {
    sfx.click();
    setGuess(chosenGuess);
    setVotes([]);
    setVoterStep(0);
    setChoiceMade(false);
    setPendingChoice(null);
    setPhase("secret");
  }

  function recordVote(inGame: boolean) {
    if (choiceMade || !currentVoter) return;
    sfx.tick();
    setPendingChoice(inGame);
    setChoiceMade(true);
  }

  function advanceVoter() {
    if (!currentVoter) return;
    const newVotes = [...votes, { playerId: currentVoter.id, inGame: pendingChoice ?? false }];
    setVotes(newVotes);

    const nextStep = voterStep + 1;
    if (nextStep >= voterList.length) {
      // All voters have answered — go to reveal
      const count = newVotes.filter((v) => v.inGame).length;
      setTotalIn(count);
      setPhase("reveal");
      setTimeout(() => {
        if (count === guess) {
          sfx.ding();
          pop(0.5, 0.4);
        } else {
          sfx.buzz();
        }
      }, 300);
    } else {
      setVoterStep(nextStep);
      setChoiceMade(false);
      setPendingChoice(null);
    }
  }

  const handleRevealNext = useCallback(() => {
    if (totalIn === null) return;

    if (totalIn === guess) {
      // Guesser is safe — remove them from the round
      const newRemaining = remaining.filter((p) => p.id !== guesser.id);

      if (newRemaining.length === 1) {
        // Last player standing must drink
        sfx.win();
        drinkRain();
        setLoser(newRemaining[0]);
        setRemaining(newRemaining);
        setPhase("drink");
        return;
      }

      // Next guesser is whoever comes after the eliminated guesser in the new list
      const newIdx = nextGuesserIndex(newRemaining, guesser.id) % newRemaining.length;
      setRemaining(newRemaining);
      setGuesserIdx(newIdx);
    } else {
      // Guesser stays in — rotate to next player
      const newIdx = (guesserIdx + 1) % remaining.length;
      setGuesserIdx(newIdx);
    }

    setGuess(null);
    setVotes([]);
    setVoterStep(0);
    setChoiceMade(false);
    setPendingChoice(null);
    setTotalIn(null);
    setPhase("guess");
  }, [totalIn, guess, remaining, guesser, guesserIdx]);

  function resetGame() {
    setRemaining(allPlayers);
    setGuesserIdx(0);
    setPhase("guess");
    setGuess(null);
    setVotes([]);
    setVoterStep(0);
    setChoiceMade(false);
    setPendingChoice(null);
    setTotalIn(null);
    setLoser(null);
  }

  /* ── render ── */

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Fingers"
        subtitle="Guess how many keep their finger in. Last one standing drinks."
        accent={ACCENT}
      />

      {/* Player chips showing who's still in */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {allPlayers.map((p) => {
          const stillIn = remaining.some((r) => r.id === p.id);
          return (
            <motion.span
              key={p.id}
              layout
              animate={stillIn ? { opacity: 1, scale: 1 } : { opacity: 0.25, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <PlayerChip
                player={p}
                active={phase !== "drink" && stillIn && p.id === guesser.id}
              />
            </motion.span>
          );
        })}
      </div>

      {/* Phase panels */}
      <AnimatePresence mode="wait">
        {/* ── GUESS phase ── */}
        {phase === "guess" && (
          <motion.div
            key="guess"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-md text-center"
            style={{ boxShadow: `0 0 40px -14px ${ACCENT}` }}
          >
            <p className="text-white/50 text-sm mb-1">It&apos;s your turn to guess,</p>
            <h3
              className="font-display text-3xl mb-1 neon-text"
              style={{ color: guesser.color }}
            >
              {guesser.name}
            </h3>
            <p className="text-white/60 text-sm mb-6">
              How many players will keep their finger <span className="text-white font-semibold">IN</span>?
              <br />
              <span className="text-white/40 text-xs">
                ({voterList.length} other{voterList.length !== 1 ? "s" : ""} voting · 0–{voterList.length})
              </span>
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: voterList.length + 1 }, (_, i) => i).map((n) => (
                <NeonButton
                  key={n}
                  size="md"
                  variant={guess === n ? "danger" : "ghost"}
                  onClick={() => startSecretPhase(n)}
                >
                  {n}
                </NeonButton>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── SECRET phase ── */}
        {phase === "secret" && currentVoter && (
          <motion.div
            key={`secret-${voterStep}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-md text-center"
            style={{ boxShadow: `0 0 40px -14px ${currentVoter.color}` }}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Pass the phone to
            </p>
            <h3
              className="font-display text-3xl mb-1 neon-text"
              style={{ color: currentVoter.color }}
            >
              {currentVoter.name}
            </h3>
            <p className="text-white/50 text-sm mb-5">
              Hide your choice from others.
              <br />
              <span className="text-white/30 text-xs">
                Step {voterStep + 1} of {voterList.length}
              </span>
            </p>

            {!choiceMade ? (
              <div className="flex gap-4 justify-center">
                <NeonButton
                  size="lg"
                  variant="success"
                  onClick={() => recordVote(true)}
                >
                  <span className="text-xl">☝️</span>&nbsp; Finger IN
                </NeonButton>
                <NeonButton
                  size="lg"
                  variant="danger"
                  onClick={() => recordVote(false)}
                >
                  <EyeOff size={18} className="inline" />&nbsp; OUT
                </NeonButton>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-lg font-bold",
                    pendingChoice ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300",
                  )}
                >
                  {pendingChoice ? (
                    <><span>☝️</span> Finger IN — locked</>
                  ) : (
                    <><EyeOff size={18} /> OUT — locked</>
                  )}
                </div>
                <p className="text-white/40 text-xs">
                  Hand the phone to the next person before continuing.
                </p>
                <NeonButton variant="ghost" size="md" onClick={advanceVoter}>
                  <Eye size={16} className="inline" />&nbsp;
                  {voterStep + 1 < voterList.length
                    ? `Pass to ${voterList[voterStep + 1].name} →`
                    : "Reveal results →"}
                </NeonButton>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── REVEAL phase ── */}
        {phase === "reveal" && totalIn !== null && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-md text-center"
            style={{ boxShadow: `0 0 50px -10px ${ACCENT}` }}
          >
            <p className="text-white/50 text-sm mb-3">
              <span style={{ color: guesser.color }} className="font-semibold">
                {guesser.name}
              </span>{" "}
              guessed
            </p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-display font-black" style={{ color: ACCENT }}>
                  {guess}
                </span>
                <span className="text-white/40 text-xs mt-1">guess</span>
              </div>
              <span className="text-white/30 text-2xl">vs</span>
              <div className="flex flex-col items-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 16 }}
                  className="text-5xl font-display font-black"
                  style={{ color: totalIn === guess ? "#b6ff3c" : "#ff5e5b" }}
                >
                  {totalIn}
                </motion.span>
                <span className="text-white/40 text-xs mt-1">fingers in</span>
              </div>
            </div>

            {totalIn === guess ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <p className="text-neon-lime font-display text-xl neon-text">
                  Correct! {guesser.name} is safe 🎉
                </p>
                <p className="text-white/50 text-sm">
                  {guesser.name} leaves the round.{" "}
                  {remaining.length - 1 > 1
                    ? `${remaining.length - 1} players remain.`
                    : ""}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-neon-coral font-display text-xl neon-text mb-1">
                  Wrong! {guesser.name} stays in.
                </p>
                <p className="text-white/50 text-sm">Guess rotates to the next player.</p>
              </motion.div>
            )}

            <NeonButton
              variant="primary"
              size="lg"
              className="mt-6"
              onClick={handleRevealNext}
            >
              Continue →
            </NeonButton>
          </motion.div>
        )}

        {/* ── DRINK phase ── */}
        {phase === "drink" && loser && (
          <motion.div
            key="drink"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="glass-strong rounded-3xl p-8 w-full max-w-md text-center"
            style={{ boxShadow: `0 0 60px -8px ${loser.color}` }}
          >
            <div className="text-5xl mb-3">🍺</div>
            <h3
              className="font-display text-3xl neon-text mb-2"
              style={{ color: loser.color }}
            >
              {loser.name}
            </h3>
            <p className="text-white/60 mb-5">
              You&apos;re the last one standing — bottom&apos;s up!
            </p>
            <DrinkCallout text={`${loser.name} drinks!`} accent={loser.color} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset */}
      <button
        onClick={resetGame}
        className="mt-8 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> new round
      </button>
    </div>
  );
}
