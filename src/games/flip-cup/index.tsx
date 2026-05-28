"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Timer } from "lucide-react";
import { NeonButton, RequirePlayers, GameHeading, DrinkCallout } from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { ACCENT as PALETTE_ACCENT } from "@/lib/palette";

const ACCENT = PALETTE_ACCENT.skill; // #2de2c0

const TEAM_COLORS: [string, string] = [PALETTE_ACCENT.skill, PALETTE_ACCENT.party];

export default function FlipCup() {
  return (
    <RequirePlayers min={4} accent={ACCENT}>
      {(players) => <Race players={players} />}
    </RequirePlayers>
  );
}

interface Team {
  name: string;
  color: string;
  players: Player[];
}

type Phase = "ready" | "racing" | "won";

function Cup({ done, active, flipping }: { done: boolean; active: boolean; flipping: boolean }) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (flipping) {
      void controls.start({
        rotate: [0, -30, 160, 180],
        y: [0, -12, -6, 0],
        transition: { duration: 0.45, ease: "easeInOut" },
      });
    }
  }, [flipping, controls]);

  return (
    <motion.div
      animate={controls}
      className={cn(
        "w-8 h-10 sm:w-10 sm:h-12 rounded-b-xl border-2 transition-colors duration-300 flex items-end justify-center pb-1",
        done ? "border-white/60 bg-white/20" : active ? "border-current bg-current/30" : "border-white/20 bg-white/5",
      )}
      style={active && !done ? { borderColor: ACCENT, background: `${ACCENT}33` } : undefined}
    >
      {done && <span className="text-xs leading-none">✅</span>}
    </motion.div>
  );
}

interface LaneProps {
  team: Team;
  progress: number; // how many players have flipped
  flippingIdx: number | null;
  canFlip: boolean;
  onFlip: () => void;
}

function Lane({ team, progress, flippingIdx, canFlip, onFlip }: LaneProps) {
  const done = progress >= team.players.length;
  const currentPlayer = done ? null : team.players[progress];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      className="glass-strong rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-4 w-full"
      style={{ boxShadow: done ? `0 0 40px -10px ${team.color}` : undefined }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ background: team.color, boxShadow: `0 0 8px 2px ${team.color}88` }}
        />
        <span className="font-display text-lg text-white">{team.name}</span>
        <span className="text-xs text-white/40 ml-1">
          {progress}/{team.players.length}
        </span>
      </div>

      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
        {team.players.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center gap-1">
            <Cup done={i < progress} active={i === progress} flipping={flippingIdx === i} />
            <span
              className="text-[9px] sm:text-[10px] max-w-[2.5rem] truncate text-center leading-none"
              style={{ color: i < progress ? "rgba(255,255,255,0.35)" : i === progress ? team.color : "rgba(255,255,255,0.45)" }}
            >
              {p.name}
            </span>
          </div>
        ))}
      </div>

      <div className="h-5 text-sm">
        {!done && currentPlayer && (
          <span className="text-white/70">
            Up: <b style={{ color: team.color }}>{currentPlayer.name}</b>
          </span>
        )}
        {done && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display text-base"
            style={{ color: team.color }}
          >
            🏆 Finished!
          </motion.span>
        )}
      </div>

      <NeonButton
        onClick={onFlip}
        size="lg"
        variant="success"
        disabled={!canFlip || done}
        className="w-full sm:w-auto"
      >
        FLIP! 🍺
      </NeonButton>
    </motion.div>
  );
}

function Race({ players }: { players: Player[] }) {
  const teams = useRef<[Team, Team]>(buildTeams(players));

  const [progress, setProgress] = useState<[number, number]>([0, 0]);
  const [flipping, setFlipping] = useState<[number | null, number | null]>([null, null]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [winner, setWinner] = useState<Team | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showDrink, setShowDrink] = useState(false);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending flip/win timeouts on unmount
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
      if (winTimeoutRef.current) { clearTimeout(winTimeoutRef.current); winTimeoutRef.current = null; }
    };
  }, []);

  // Timer management
  useEffect(() => {
    if (phase === "racing") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  function startRace() {
    sfx.whoosh();
    setPhase("racing");
    setProgress([0, 0]);
    setFlipping([null, null]);
    setElapsed(0);
    setWinner(null);
    setShowDrink(false);
  }

  function handleFlip(teamIdx: 0 | 1) {
    if (phase !== "racing") return;
    const teamSize = teams.current[teamIdx].players.length;
    const cur = progress[teamIdx];
    if (cur >= teamSize) return;
    sfx.ding();
    setFlipping((f) => teamIdx === 0 ? [cur, f[1]] : [f[0], cur]);

    if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
    flipTimeoutRef.current = setTimeout(() => {
      flipTimeoutRef.current = null;
      setFlipping((f) => teamIdx === 0 ? [null, f[1]] : [f[0], null]);
      const next = cur + 1;
      setProgress((p) => {
        const updated: [number, number] = teamIdx === 0 ? [next, p[1]] : [p[0], next];

        // Check win condition
        if (next >= teamSize) {
          // Stop the racing timer immediately — don't wait for the phase effect
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          if (winTimeoutRef.current) { clearTimeout(winTimeoutRef.current); winTimeoutRef.current = null; }
          winTimeoutRef.current = setTimeout(() => {
            winTimeoutRef.current = null;
            sfx.win();
            celebrate();
            setShowDrink(true);
            setWinner(teams.current[teamIdx]);
            setPhase("won");
          }, 50);
        }
        return updated;
      });
    }, 500);
  }

  function rematch() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
    if (winTimeoutRef.current) { clearTimeout(winTimeoutRef.current); winTimeoutRef.current = null; }
    teams.current = buildTeams(players);
    setProgress([0, 0]);
    setFlipping([null, null]);
    setPhase("ready");
    setWinner(null);
    setElapsed(0);
    setShowDrink(false);
  }

  const [t1, t2] = teams.current;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <GameHeading
        title="Flip Cup"
        subtitle="Chug → set cup on edge → flip it upside-down. First team through all players wins!"
        accent={ACCENT}
      />

      {/* Timer */}
      {(phase === "racing" || phase === "won") && (
        <div className="flex items-center gap-1.5 text-sm text-white/50 mb-4">
          <Timer size={14} style={{ color: ACCENT }} />
          <span style={{ color: ACCENT }} className="font-mono font-semibold">
            {formatTime(elapsed)}
          </span>
        </div>
      )}

      {/* Ready state */}
      {phase === "ready" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-6 text-center mb-6 max-w-sm w-full"
        >
          <p className="text-white/70 mb-2 text-sm leading-relaxed">
            Teams are set. Each player chugs, places their cup on the table edge,
            and flips it upside-down. <span className="text-white">Tap your team&apos;s FLIP button when your cup lands!</span>
          </p>
          <div className="flex gap-3 justify-center mt-4 text-xs text-white/50">
            <span style={{ color: t1.color }}>● {t1.name}</span>
            <span>vs</span>
            <span style={{ color: t2.color }}>● {t2.name}</span>
          </div>
        </motion.div>
      )}

      {/* Race lanes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
        <Lane
          team={t1}
          progress={progress[0]}
          flippingIdx={flipping[0]}
          canFlip={phase === "racing"}
          onFlip={() => handleFlip(0)}
        />
        <Lane
          team={t2}
          progress={progress[1]}
          flippingIdx={flipping[1]}
          canFlip={phase === "racing"}
          onFlip={() => handleFlip(1)}
        />
      </div>

      {/* Win callout */}
      <div className="h-16 flex items-center justify-center">
        <AnimatePresence>
          {phase === "won" && winner && showDrink && (
            <motion.div
              key="winner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <DrinkCallout
                text={`🏆 ${winner.name} wins! Losers drink!`}
                accent={winner.color}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-2">
        {phase === "ready" && (
          <NeonButton onClick={startRace} size="lg" variant="primary">
            Start Race!
          </NeonButton>
        )}
        {(phase === "racing" || phase === "won") && (
          <button
            onClick={rematch}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
          >
            <RotateCcw size={13} /> Rematch
          </button>
        )}
      </div>

      {/* Team rosters preview */}
      {phase === "ready" && (
        <div className="flex gap-6 mt-6 text-xs text-white/40">
          <div>
            <span style={{ color: t1.color }} className="font-semibold">{t1.name}</span>
            {": "}
            {t1.players.map((p) => p.name).join(", ")}
          </div>
          <div>
            <span style={{ color: t2.color }} className="font-semibold">{t2.name}</span>
            {": "}
            {t2.players.map((p) => p.name).join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

function buildTeams(players: Player[]): [Team, Team] {
  const mid = Math.ceil(players.length / 2);
  return [
    { name: "Team 1", color: TEAM_COLORS[0], players: players.slice(0, mid) },
    { name: "Team 2", color: TEAM_COLORS[1], players: players.slice(mid) },
  ];
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
