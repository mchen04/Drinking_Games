"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, RotateCcw, Info } from "lucide-react";
import { NeonButton, RequirePlayers, GameHeading, DrinkCallout, PlayerChip } from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { drinkRain, pop } from "@/lib/confetti";
import { pickRandom } from "@/lib/random";
import { cn } from "@/lib/cn";
import { ON_BEAT_PHRASES, MISS_PHRASES, RULES_TEXT } from "./data";
import { useThumperBeat } from "./useThumperBeat";

const ACCENT = "#ff5e5b";
const BPM_START = 60;
const BPM_STEP = 5;
const BPM_MAX = 160;
/** Taps needed in a row before BPM increases. */
const TAPS_PER_LEVEL = 5;
/** Tolerance window: fraction of the beat interval that counts as "on beat". */
const TOLERANCE_FRACTION = 0.28;

export default function Thumper() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <ThumperGame players={players} />}
    </RequirePlayers>
  );
}

// ---------------------------------------------------------------------------
// Inner game
// ---------------------------------------------------------------------------

type GamePhase = "idle" | "playing" | "result";

interface TapResult {
  kind: "hit" | "miss";
  phrase: string;
}

function ThumperGame({ players }: { players: Player[] }) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [bpm, setBpm] = useState(BPM_START);
  const [streak, setStreak] = useState(0);
  const [levelStreak, setLevelStreak] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [tapResult, setTapResult] = useState<TapResult | null>(null);
  const [showRules, setShowRules] = useState(false);

  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----------------------------------------------------------------
  // Handlers — defined before the hook so handleMiss can be passed in
  // ----------------------------------------------------------------
  function handleHit() {
    sfx.ding();
    pop(0.5, 0.5);

    const phrase = pickRandom(ON_BEAT_PHRASES);
    setTapResult({ kind: "hit", phrase });

    setStreak((s) => s + 1);
    setLevelStreak((ls) => {
      const next = ls + 1;
      if (next >= TAPS_PER_LEVEL) {
        // Level up — increase BPM
        setBpm((b) => Math.min(b + BPM_STEP, BPM_MAX));
        return 0;
      }
      return next;
    });

    // Advance to next player
    setTurnIdx((i) => i + 1);

    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => setTapResult(null), 600);
  }

  const handleMiss = useCallback(() => {
    sfx.buzz();
    drinkRain();

    const phrase = pickRandom(MISS_PHRASES);
    setTapResult({ kind: "miss", phrase });
    setStreak(0);
    setLevelStreak(0);

    // Keep same player on the same beat — they drink then try again
    // Pause game briefly so DrinkCallout is visible
    setPhase("result");
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setTapResult(null);
      setPhase("playing");
    }, 2200);
  }, []);

  // Cleanup result timer on unmount
  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  // ----------------------------------------------------------------
  // Beat hook — owns intervalRef, lastBeatRef, tapProcessedRef
  // ----------------------------------------------------------------
  const { pulseControls, judgeTap } = useThumperBeat({ phase, bpm, onMiss: handleMiss });

  // ----------------------------------------------------------------
  // Tap handler
  // ----------------------------------------------------------------
  function handleTap() {
    const verdict = judgeTap();
    if (verdict === "hit") handleHit();
    else if (verdict === "miss") handleMiss();
  }

  function startGame() {
    sfx.click();
    setPhase("playing");
    setStreak(0);
    setLevelStreak(0);
    setBpm(BPM_START);
    setTurnIdx(0);
    setTapResult(null);
  }

  function resetGame() {
    sfx.click();
    setPhase("idle");
    setStreak(0);
    setLevelStreak(0);
    setBpm(BPM_START);
    setTurnIdx(0);
    setTapResult(null);
  }

  // ----------------------------------------------------------------
  // Derived display values
  // ----------------------------------------------------------------
  const activePlayer = players[turnIdx % players.length];
  const intervalMs = Math.round((60 / bpm) * 1000);
  const glowColor = tapResult?.kind === "hit" ? "#b6ff3c" : ACCENT;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Thumper"
        subtitle={`Tap in rhythm or drink! ${bpm} BPM · streak ${streak}`}
        accent={ACCENT}
      />

      {/* Player chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={phase === "playing" && i === turnIdx % players.length}
          />
        ))}
      </div>

      {/* Active player label while playing */}
      <AnimatePresence mode="wait">
        {phase === "playing" && (
          <motion.p
            key={`turn-${turnIdx}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="text-sm text-white/60 mb-4"
          >
            <b style={{ color: activePlayer.color }}>{activePlayer.name}</b> — tap the beat!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Metronome pulse circle */}
      <div className="relative flex items-center justify-center mb-8 select-none">
        {/* Outer glow ring */}
        <motion.div
          animate={phase === "playing" ? {
            boxShadow: [
              `0 0 30px -8px ${ACCENT}55`,
              `0 0 60px -4px ${ACCENT}cc`,
              `0 0 30px -8px ${ACCENT}55`,
            ],
          } : {}}
          transition={{ duration: (60 / bpm), repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-56 h-56 rounded-full"
          style={{ border: `2px solid ${ACCENT}33` }}
        />

        {/* Main pulse orb */}
        <div
          className="w-44 h-44 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: `radial-gradient(circle at 40% 35%, ${ACCENT}cc, ${ACCENT}55 60%, #1a0505 100%)`,
            boxShadow: `0 0 40px -8px ${glowColor}, inset 0 0 30px -10px #ffffff22`,
          }}
        >
          <motion.div animate={pulseControls} className="w-full h-full rounded-full flex items-center justify-center">
            <Music2 size={48} color="white" style={{ opacity: 0.9 }} />
          </motion.div>
        </div>

        {/* BPM badge */}
        <div
          className="absolute bottom-0 right-0 glass rounded-full px-3 py-1 text-xs font-mono font-bold"
          style={{ color: ACCENT }}
        >
          {bpm} BPM
        </div>
      </div>

      {/* Tap result feedback */}
      <div className="h-14 flex items-center justify-center mb-4">
        <AnimatePresence mode="wait">
          {tapResult?.kind === "miss" && (
            <DrinkCallout key="miss" text={tapResult.phrase} accent={ACCENT} />
          )}
          {tapResult?.kind === "hit" && (
            <motion.p
              key="hit"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="font-display text-xl neon-text"
              style={{ color: "#b6ff3c" }}
            >
              {tapResult.phrase}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Level progress bar */}
      {phase === "playing" && (
        <div className="w-full max-w-xs mb-6">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>to next level</span>
            <span>{levelStreak}/{TAPS_PER_LEVEL}</span>
          </div>
          <div className="h-1.5 glass rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: ACCENT }}
              animate={{ width: `${(levelStreak / TAPS_PER_LEVEL) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {phase === "idle" ? (
          <NeonButton onClick={startGame} size="lg" variant="primary">
            Start the Beat
          </NeonButton>
        ) : (
          <>
            <NeonButton
              onClick={handleTap}
              size="lg"
              variant="danger"
              disabled={phase === "result"}
              className="min-w-40"
            >
              TAP
            </NeonButton>
            <NeonButton onClick={resetGame} size="md" variant="ghost">
              <RotateCcw size={16} />
            </NeonButton>
          </>
        )}
      </div>

      {/* Stats row */}
      {(phase === "playing" || phase === "result") && (
        <div className="mt-6 flex items-center gap-6 text-sm text-white/50">
          <span>streak <b className="text-white">{streak}</b></span>
          <span>bpm <b style={{ color: ACCENT }}>{bpm}</b></span>
          <span>window <b className="text-white/70">{Math.round(intervalMs * TOLERANCE_FRACTION)}ms</b></span>
        </div>
      )}

      {/* Rules toggle */}
      <button
        onClick={() => setShowRules((v) => !v)}
        className={cn(
          "mt-8 flex items-center gap-1.5 text-xs transition-colors",
          showRules ? "text-white/70" : "text-white/30 hover:text-white/70",
        )}
      >
        <Info size={13} /> {showRules ? "hide rules" : "how to play"}
      </button>

      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden w-full max-w-sm mt-3"
          >
            <div
              className="glass-strong rounded-2xl p-4 text-sm text-white/65 leading-relaxed whitespace-pre-line"
              style={{ borderLeft: `3px solid ${ACCENT}` }}
            >
              {RULES_TEXT}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
