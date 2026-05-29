"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { NeonButton } from "@/components/ui";
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
    <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
      {/* Editable team name */}
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={18}
        disabled={disabled}
        className={cn(
          "bg-transparent border-b-2 text-center font-display text-lg sm:text-xl font-bold text-white",
          "focus:outline-none placeholder-white/30 transition-colors w-full max-w-[180px]",
          disabled ? "cursor-default opacity-60" : "hover:border-white/60 focus:border-white",
        )}
        style={{ borderColor: accent + "99" }}
        placeholder="Team name"
        aria-label="Team name"
      />

      {/* Remaining badge — count pops when it changes */}
      <div
        className="glass rounded-full px-3 py-1 text-sm font-semibold flex items-baseline gap-1"
        style={{ color: accent, boxShadow: `inset 0 0 0 1px ${accent}44` }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={remaining}
            initial={{ scale: 1.5, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0, y: 4 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="tabular-nums inline-block"
          >
            {remaining}
          </motion.span>
        </AnimatePresence>
        <span>cup{remaining !== 1 ? "s" : ""} left</span>
      </div>

      {/* Cup triangle rack */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-1">
        {RACK_ROWS.map((count, rowIdx) => {
          const offset = ROW_OFFSETS[rowIdx];
          return (
            <div key={rowIdx} className="flex gap-1.5 sm:gap-2 justify-center">
              {Array.from({ length: count }, (_, colIdx) => {
                const cupIdx = offset + colIdx;
                const sunk = cups[cupIdx];
                return (
                  <AnimatePresence key={cupIdx} initial={false} mode="wait">
                    {!sunk ? (
                      <motion.button
                        key="cup"
                        initial={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.2, opacity: 0, y: 22, rotate: 18, filter: "blur(2px)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 24 }}
                        onClick={() => onCupTap(cupIdx)}
                        disabled={disabled || pendingTaps.has(cupIdx)}
                        aria-label={`Cup ${cupIdx + 1}`}
                        className={cn(
                          "w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center",
                          "transition-shadow select-none",
                          disabled || pendingTaps.has(cupIdx)
                            ? "cursor-default opacity-50"
                            : "cursor-pointer",
                        )}
                        style={{
                          borderColor: accent,
                          background: `radial-gradient(circle at 35% 35%, ${accent}55, ${accent}18)`,
                          boxShadow: disabled || pendingTaps.has(cupIdx) ? "none" : `0 0 12px -3px ${accent}`,
                        }}
                        whileHover={disabled || pendingTaps.has(cupIdx) ? undefined : { scale: 1.12 }}
                        whileTap={disabled || pendingTaps.has(cupIdx) ? undefined : { scale: 0.9 }}
                      >
                        <span className="text-base sm:text-lg">🍺</span>
                      </motion.button>
                    ) : (
                      /* Ghost placeholder to preserve grid shape */
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2"
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
      className="glass-strong rounded-3xl p-5 sm:p-6 text-center w-full max-w-sm mx-auto"
      style={{ boxShadow: `0 0 60px -12px ${ACCENT}` }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
      >
        <Trophy size={42} className="mx-auto mb-2 animate-bob" style={{ color: ACCENT }} />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-2xl sm:text-3xl font-bold mb-1"
        style={{ color: ACCENT }}
      >
        {winner} wins!
      </motion.h3>
      <p className="text-white/60 text-sm mb-2">
        🏆 All cups cleared!
      </p>
      <p className="text-white/50 text-xs mb-4 leading-relaxed">
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
          // A team whose cups are all sunk is OUT — the OTHER team wins.
          const winningTeam = teamNamesRef.current[teamIdx === 0 ? 1 : 0];
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

  // Cancel a pending winner timer if the component unmounts mid-celebration.
  useEffect(
    () => () => {
      if (winnerTimerRef.current !== null) clearTimeout(winnerTimerRef.current);
    },
    [],
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
      <p className="text-white/50 text-sm text-center mb-3 max-w-sm">
        Tap a team&apos;s cup when it gets sunk. Lose all 10 and you&apos;re out — last team standing wins! 🏆
      </p>

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
            {/* Score bar — numbers pop on change */}
            <div className="flex items-center justify-center gap-4 mb-3">
              {([0, 1] as const).map((teamIdx) => (
                <div key={teamIdx} className="contents">
                  <div className="font-display text-2xl font-bold tabular-nums overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={remaining[teamIdx]}
                        initial={{ scale: 1.5, opacity: 0, y: -8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.6, opacity: 0, y: 8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 20 }}
                        className="inline-block"
                        style={{ color: ACCENT }}
                      >
                        {remaining[teamIdx]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  {teamIdx === 0 && (
                    <span className="text-white/30 text-sm font-semibold uppercase tracking-widest">
                      vs
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Two racks — side-by-side on sm+, stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center sm:items-start w-full">
              {([0, 1] as const).map((teamIdx) => (
                <motion.div
                  key={teamIdx}
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.06 + teamIdx * 0.08, ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                  className="glass rounded-3xl p-3 sm:p-6 w-full max-w-[240px]"
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
                </motion.div>
              ))}
            </div>

            {/* Reset link */}
            <div className="mt-3 text-center">
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
