"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useRef } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { NeonButton, GameHeading } from "@/components/ui";
import { sfx } from "@/lib/sound";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/cn";

const ACCENT = "#2de2c0";

// Triangle rack: 4 rows = [4, 3, 2, 1] = 10 cups total
const RACK_ROWS = [4, 3, 2, 1] as const;
const TOTAL_CUPS = 10;

function makeCups(): boolean[] {
  // false = still standing, true = sunk
  return Array(TOTAL_CUPS).fill(false);
}

// Map a flat cup index to its row/col given RACK_ROWS = [4,3,2,1]
// Row 0 → cups 0-3, Row 1 → cups 4-6, Row 2 → cups 7-8, Row 3 → cup 9
const ROW_OFFSETS: number[] = [];
{
  let offset = 0;
  for (const count of RACK_ROWS) {
    ROW_OFFSETS.push(offset);
    offset += count;
  }
}

interface TeamRackProps {
  name: string;
  onNameChange: (n: string) => void;
  cups: boolean[];
  /** Indices that have been tapped but whose exit animation is still running */
  pendingTaps: ReadonlySet<number>;
  onCupTap: (index: number) => void;
  accent: string;
  disabled: boolean;
  remaining: number;
}

function TeamRack({ name, onNameChange, cups, pendingTaps, onCupTap, accent, disabled, remaining }: TeamRackProps) {
  return (
    <div className="flex flex-col items-center gap-4 flex-1 min-w-0">
      {/* Editable team name */}
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={18}
        disabled={disabled}
        className={cn(
          "bg-transparent border-b-2 text-center font-display text-xl font-bold text-white",
          "focus:outline-none placeholder-white/30 transition-colors w-full max-w-[180px]",
          disabled ? "cursor-default opacity-60" : "hover:border-white/60 focus:border-white",
        )}
        style={{ borderColor: accent + "99" }}
        placeholder="Team name"
        aria-label="Team name"
      />

      {/* Remaining badge */}
      <div
        className="glass rounded-full px-3 py-1 text-sm font-semibold"
        style={{ color: accent, boxShadow: `inset 0 0 0 1px ${accent}44` }}
      >
        {remaining} cup{remaining !== 1 ? "s" : ""} left
      </div>

      {/* Cup triangle rack */}
      <div className="flex flex-col items-center gap-2 py-2">
        {RACK_ROWS.map((count, rowIdx) => {
          const offset = ROW_OFFSETS[rowIdx];
          return (
            <div key={rowIdx} className="flex gap-2 justify-center">
              {Array.from({ length: count }, (_, colIdx) => {
                const cupIdx = offset + colIdx;
                const sunk = cups[cupIdx];
                return (
                  <AnimatePresence key={cupIdx} initial={false}>
                    {!sunk ? (
                      <motion.button
                        key="cup"
                        initial={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.1, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 360, damping: 22 }}
                        onClick={() => onCupTap(cupIdx)}
                        disabled={disabled || pendingTaps.has(cupIdx)}
                        aria-label={`Cup ${cupIdx + 1}`}
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center",
                          "transition-shadow select-none",
                          disabled || pendingTaps.has(cupIdx)
                            ? "cursor-default opacity-50"
                            : "cursor-pointer hover:scale-110 active:scale-95",
                        )}
                        style={{
                          borderColor: accent,
                          background: `radial-gradient(circle at 35% 35%, ${accent}55, ${accent}18)`,
                          boxShadow: disabled || pendingTaps.has(cupIdx) ? "none" : `0 0 12px -3px ${accent}`,
                        }}
                        whileHover={disabled || pendingTaps.has(cupIdx) ? undefined : { scale: 1.12 }}
                        whileTap={disabled || pendingTaps.has(cupIdx) ? undefined : { scale: 0.9 }}
                      >
                        <span className="text-lg">🍺</span>
                      </motion.button>
                    ) : (
                      /* Ghost placeholder to preserve grid shape */
                      <div
                        key="empty"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 opacity-15"
                        style={{ borderColor: accent }}
                        aria-hidden="true"
                      />
                    )}
                  </AnimatePresence>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Winner overlay ────────────────────────────────────────────────────────────

interface WinnerBannerProps {
  winner: string;
  onRematch: () => void;
}

function WinnerBanner({ winner, onRematch }: WinnerBannerProps) {
  return (
    <motion.div
      key="winner"
      initial={{ opacity: 0, scale: 0.75, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="glass-strong rounded-3xl p-8 text-center w-full max-w-sm mx-auto"
      style={{ boxShadow: `0 0 60px -12px ${ACCENT}` }}
    >
      <Trophy size={48} className="mx-auto mb-3" style={{ color: ACCENT }} />
      <h3 className="font-display text-3xl font-bold mb-1" style={{ color: ACCENT }}>
        {winner} wins!
      </h3>
      <p className="text-white/60 text-sm mb-2">
        🏆 All cups cleared!
      </p>
      <p className="text-white/50 text-xs mb-6 leading-relaxed">
        <span className="text-white/75 font-semibold">Redemption round:</span> The losing team
        gets one last turn to sink all remaining cups. If they clear the rack, the game goes to
        overtime — re-rack and sudden death!
      </p>
      <NeonButton onClick={onRematch} variant="success" size="lg" fullWidth>
        <RotateCcw size={16} className="inline mr-2" />
        Rematch
      </NeonButton>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function BeerPong() {
  const [teamNames, setTeamNames] = useState<[string, string]>(["Team A", "Team B"]);
  const [cups, setCups] = useState<[boolean[], boolean[]]>([makeCups(), makeCups()]);
  const [winner, setWinner] = useState<string | null>(null);
  // Track cups tapped-but-not-yet-removed (exit animation in flight) to prevent double-fire
  const [pendingTaps, setPendingTaps] = useState<[Set<number>, Set<number>]>([new Set(), new Set()]);

  // Stable ref so the functional setCups updater can read the latest team name without
  // the teamNames value being captured in a stale closure.
  const teamNamesRef = useRef(teamNames);
  teamNamesRef.current = teamNames;

  const winnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = cups.map((teamCups) => teamCups.filter((s) => !s).length) as [number, number];

  const handleCupTap = useCallback(
    (teamIdx: 0 | 1, cupIdx: number) => {
      if (winner) return;

      // Guard against double-fire: cup already sunk or exit-animation in flight
      setPendingTaps((prevPending) => {
        if (prevPending[teamIdx].has(cupIdx)) return prevPending; // already pending — no-op
        const next = [new Set(prevPending[0]), new Set(prevPending[1])] as [Set<number>, Set<number>];
        next[teamIdx].add(cupIdx);
        return next;
      });

      sfx.ding();

      setCups((prev) => {
        // If already sunk in state, bail out (safety net for concurrent React batches)
        if (prev[teamIdx][cupIdx]) return prev;

        const next = prev.map((arr) => [...arr]) as [boolean[], boolean[]];
        next[teamIdx][cupIdx] = true;

        // Win check computed from next state — no stale-closure risk
        const newRemaining = next[teamIdx].filter((s) => !s).length;
        if (newRemaining <= 0) {
          const winningTeam = teamNamesRef.current[teamIdx];
          // Clear any existing timer before scheduling a new one
          if (winnerTimerRef.current !== null) {
            clearTimeout(winnerTimerRef.current);
          }
          winnerTimerRef.current = setTimeout(() => {
            winnerTimerRef.current = null;
            celebrate();
            sfx.win();
            setWinner(winningTeam);
          }, 350);
        }

        return next;
      });
    },
    [winner],
  );

  function handleRematch() {
    if (winnerTimerRef.current !== null) {
      clearTimeout(winnerTimerRef.current);
      winnerTimerRef.current = null;
    }
    setCups([makeCups(), makeCups()]);
    setPendingTaps([new Set(), new Set()]);
    setWinner(null);
    sfx.click();
  }

  function handleNameChange(idx: 0 | 1, name: string) {
    setTeamNames((prev) => {
      const next = [...prev] as [string, string];
      next[idx] = name;
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center w-full">
      <GameHeading
        title="Beer Pong"
        subtitle="Tap a cup to mark it sunk. First team to clear all 10 wins!"
        accent={ACCENT}
      />

      <AnimatePresence mode="wait">
        {winner ? (
          <WinnerBanner key="winner" winner={winner} onRematch={handleRematch} />
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {/* Score bar */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <span
                className="font-display text-2xl font-bold tabular-nums"
                style={{ color: ACCENT }}
              >
                {remaining[0]}
              </span>
              <span className="text-white/30 text-sm font-semibold uppercase tracking-widest">
                vs
              </span>
              <span
                className="font-display text-2xl font-bold tabular-nums"
                style={{ color: ACCENT }}
              >
                {remaining[1]}
              </span>
            </div>

            {/* Two racks — side-by-side on sm+, stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-6 justify-center items-center sm:items-start w-full">
              {([0, 1] as const).map((teamIdx) => (
                <div
                  key={teamIdx}
                  className="glass rounded-3xl p-5 sm:p-6 w-full max-w-[240px]"
                  style={{ boxShadow: `0 0 30px -14px ${ACCENT}` }}
                >
                  <TeamRack
                    name={teamNames[teamIdx]}
                    onNameChange={(n) => handleNameChange(teamIdx, n)}
                    cups={cups[teamIdx]}
                    pendingTaps={pendingTaps[teamIdx]}
                    onCupTap={(ci) => handleCupTap(teamIdx, ci)}
                    accent={ACCENT}
                    disabled={!!winner}
                    remaining={remaining[teamIdx]}
                  />
                </div>
              ))}
            </div>

            {/* Reset link */}
            <div className="mt-8 text-center">
              <button
                onClick={handleRematch}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors mx-auto"
              >
                <RotateCcw size={13} /> reset game
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
