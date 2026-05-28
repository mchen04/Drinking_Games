"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  NeonButton,
  GameHeading,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { cn } from "@/lib/cn";

const ACCENT = "#2de2c0";

// Power meter oscillates between 0–100; hit window is ±12 around 50
const METER_SPEED = 1.6; // % per frame at 60fps
const HIT_MIN = 38;
const HIT_MAX = 62;

// ─── Phase types ─────────────────────────────────────────────────────────────
type Phase =
  | "idle"        // waiting for Bounce press
  | "locked"      // power locked, animating arc
  | "made"        // landed in cup — assign drink
  | "missed"      // missed — pass to next
  | "assigned";   // drink assigned, shoot again

// ─── Main export (gate) ───────────────────────────────────────────────────────
export default function Quarters() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <QuartersGame players={players} />}
    </RequirePlayers>
  );
}

// ─── Inner game ───────────────────────────────────────────────────────────────
function QuartersGame({ players }: { players: Player[] }) {
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [power, setPower] = useState(0);
  const [lockedPower, setLockedPower] = useState(0);
  const [makes, setMakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [assignTarget, setAssignTarget] = useState<Player | null>(null);

  // refs for the rAF loop
  const rafRef = useRef<number | null>(null);
  const dirRef = useRef(1);
  const powerRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  // activeRef is set to false on unmount so the tick cannot run after the
  // component is gone, even if a frame slips through cancelAnimationFrame.
  const activeRef = useRef(true);

  const coinControls = useAnimationControls();
  const splashControls = useAnimationControls();

  const shooter = players[turn % players.length];

  // Keep phaseRef in sync so the rAF loop can read it without stale closure
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Mark the component unmounted so any in-flight tick exits immediately.
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  // Oscillating power meter (runs only in "idle" phase)
  const startMeter = useCallback(() => {
    dirRef.current = 1;
    powerRef.current = 0;

    function tick() {
      // Stop if unmounted or phase has moved past idle.
      if (!activeRef.current || phaseRef.current !== "idle") return;
      powerRef.current += METER_SPEED * dirRef.current;
      if (powerRef.current >= 100) { powerRef.current = 100; dirRef.current = -1; }
      if (powerRef.current <= 0)   { powerRef.current = 0;   dirRef.current =  1; }
      setPower(Math.round(powerRef.current));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Start the meter when the phase is idle; cancel it on any phase change or unmount.
  useEffect(() => {
    if (phase === "idle") {
      startMeter();
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, startMeter]);

  // ── Bounce (lock power) ──
  async function bounce() {
    if (phase !== "idle") return;
    sfx.whoosh();
    const p = powerRef.current;
    setLockedPower(Math.round(p));
    setPhase("locked");

    const hit = p >= HIT_MIN && p <= HIT_MAX;

    // Arc animation: translate X + parabolic Y via keyframes
    await coinControls.start({
      x: hit ? [0, 60, 160, 280] : [0, 50, 130, 200],
      y: hit ? [0, -90, -50, 20] : [0, -60, -20, 80],
      rotate: [0, 180, 360, 540],
      opacity: [1, 1, 1, hit ? 0 : 1],
      transition: { duration: 0.65, ease: "easeIn" },
    });
    if (!activeRef.current) return;

    if (hit) {
      sfx.ding();
      pop(0.65, 0.55);
      splashControls.start({ scale: [0, 1.4, 1], opacity: [0, 1, 0], transition: { duration: 0.55 } });
      const s = streak + 1;
      setStreak(s);
      setBestStreak((b) => Math.max(b, s));
      setMakes((m) => m + 1);
      setPhase("made");
    } else {
      sfx.buzz();
      // shake coin briefly to show it bounced off
      await coinControls.start({
        x: [200, 190, 210, 195],
        y: [80, 95, 80, 95],
        transition: { duration: 0.3 },
      });
      if (!activeRef.current) return;
      setStreak(0);
      setPhase("missed");
    }

    // reset coin position
    coinControls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
  }

  // ── Assign drink ──
  function assignDrink(player: Player) {
    if (phase !== "made") return;
    sfx.pour();
    drinkRain();
    setAssignTarget(player);
    setPhase("assigned");
  }

  // ── Shoot again after assigning ──
  function shootAgain() {
    setAssignTarget(null);
    setPhase("idle");
  }

  // ── Pass to next player ──
  function passCup() {
    setTurn((t) => t + 1);
    setAssignTarget(null);
    setPhase("idle");
  }

  // ── Reset entire game ──
  function resetGame() {
    setTurn(0);
    setPhase("idle");
    setPower(0);
    setLockedPower(0);
    setMakes(0);
    setStreak(0);
    setAssignTarget(null);
    coinControls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
  }

  return (
    <div className="flex flex-col items-center select-none">
      <GameHeading
        title="Quarters"
        subtitle="Lock the power when the meter hits the sweet spot — bounce it in!"
        accent={ACCENT}
      />

      {/* Player turn strip */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turn % players.length}
          />
        ))}
      </div>

      {/* Shooter label */}
      <p className="text-white/60 text-sm mb-4">
        <b style={{ color: shooter.color }}>{shooter.name}</b>&apos;s shot
      </p>

      {/* ── PLAY AREA ── */}
      <div className="relative w-full max-w-sm mx-auto">
        {/* Cup + table */}
        <div className="relative flex justify-end pr-8 mb-2">
          {/* Cup */}
          <div
            className="relative w-14 h-16 rounded-b-2xl rounded-t-sm border-2 overflow-hidden"
            style={{ borderColor: `${ACCENT}80` }}
          >
            {/* liquid inside cup */}
            <div
              className="absolute bottom-0 left-0 right-0 h-3/5 rounded-b-2xl opacity-60"
              style={{ background: `linear-gradient(180deg, ${ACCENT}60, ${ACCENT}aa)` }}
            />
            <span className="absolute inset-0 flex items-start justify-center pt-1 text-xl leading-none">
              🥃
            </span>
            {/* splash overlay */}
            <motion.div
              animate={splashControls}
              className="absolute inset-0 flex items-center justify-center text-2xl pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
            >
              💦
            </motion.div>
          </div>
        </div>

        {/* Table surface */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 rounded-full opacity-40"
          style={{ background: ACCENT }}
        />

        {/* Coin arc area */}
        <div className="relative h-28 flex items-end pl-8">
          {/* Launch position marker */}
          <div
            className="w-4 h-4 rounded-full border-2 mb-3 opacity-40 flex-shrink-0"
            style={{ borderColor: ACCENT }}
          />

          {/* Animated quarter */}
          <motion.div
            animate={coinControls}
            className="absolute left-8 bottom-3 text-2xl leading-none cursor-default z-10"
          >
            🪙
          </motion.div>
        </div>
      </div>

      {/* ── POWER METER ── */}
      <div className="w-full max-w-xs mt-6 mb-1">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>weak</span>
          <span className="text-xs" style={{ color: ACCENT }}>
            sweet spot
          </span>
          <span>weak</span>
        </div>
        <div className="relative h-6 glass rounded-full overflow-hidden border border-white/10">
          {/* Hit window highlight */}
          <div
            className="absolute top-0 bottom-0 rounded-full opacity-20"
            style={{
              left: `${HIT_MIN}%`,
              width: `${HIT_MAX - HIT_MIN}%`,
              background: ACCENT,
            }}
          />
          {/* Moving power fill */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 rounded-full"
            style={{
              width: `${phase === "idle" ? power : lockedPower}%`,
              background:
                (phase === "idle" ? power : lockedPower) >= HIT_MIN &&
                (phase === "idle" ? power : lockedPower) <= HIT_MAX
                  ? `linear-gradient(90deg, ${ACCENT}99, ${ACCENT})`
                  : "linear-gradient(90deg, #9d4edd99, #9d4edd)",
            }}
            transition={phase === "idle" ? { duration: 0 } : { duration: 0.15 }}
          />
          {/* Lock indicator when locked */}
          {phase !== "idle" && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              className="absolute top-0 bottom-0 w-0.5 rounded-full"
              style={{
                left: `${lockedPower}%`,
                background: "#fff",
                boxShadow: "0 0 6px #fff",
              }}
            />
          )}
        </div>
        <p className="text-center text-xs text-white/40 mt-1">
          {phase === "idle"
            ? `${power}%`
            : `locked at ${lockedPower}% — ${lockedPower >= HIT_MIN && lockedPower <= HIT_MAX ? "✓ in the zone!" : "✗ out of range"}`}
        </p>
      </div>

      {/* ── OUTCOME PANEL ── */}
      <div className="min-h-[7rem] w-full max-w-sm mt-5 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <NeonButton onClick={bounce} size="lg" variant="success">
                🪙 Bounce!
              </NeonButton>
              <p className="text-white/40 text-xs">Tap when the meter is in the teal zone</p>
            </motion.div>
          )}

          {phase === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/50 text-sm"
            >
              flying…
            </motion.div>
          )}

          {phase === "made" && (
            <motion.div
              key="made"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl p-5 w-full text-center"
              style={{ boxShadow: `0 0 40px -10px ${ACCENT}` }}
            >
              <p className="font-display text-xl mb-1" style={{ color: ACCENT }}>
                🎯 Made it!
              </p>
              <p className="text-white/60 text-sm mb-4">
                Assign a drink — then shoot again!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {players
                  .filter((p) => p.id !== shooter.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => assignDrink(p)}
                      className={cn(
                        "flex items-center gap-2 glass rounded-full px-3 py-2 text-sm",
                        "hover:scale-105 active:scale-95 transition-transform",
                        "border border-white/10 hover:border-white/30",
                      )}
                      style={{ color: p.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          {phase === "assigned" && assignTarget && (
            <motion.div
              key="assigned"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <DrinkCallout
                text={`${assignTarget.name}, drink!`}
                accent={assignTarget.color}
              />
              <NeonButton onClick={shootAgain} size="md" variant="success">
                Shoot again 🪙
              </NeonButton>
            </motion.div>
          )}

          {phase === "missed" && (
            <motion.div
              key="missed"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl p-5 w-full text-center"
              style={{ boxShadow: "0 0 40px -14px #ff5e5b" }}
            >
              <p className="font-display text-xl text-white/90 mb-1">
                😬 Missed!
              </p>
              <p className="text-white/55 text-sm mb-4">
                Pass the cup to{" "}
                <b style={{ color: players[(turn + 1) % players.length].color }}>
                  {players[(turn + 1) % players.length].name}
                </b>
              </p>
              <NeonButton onClick={passCup} size="md" variant="ghost">
                Pass the cup →
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STATS ── */}
      <div className="mt-6 flex items-center gap-5 text-sm text-white/50">
        <span>
          makes <b className="text-white">{makes}</b>
        </span>
        <span>
          streak{" "}
          <b style={{ color: ACCENT }}>{streak}</b>
        </span>
        <span>
          best <b className="text-neon-amber">{bestStreak}</b>
        </span>
      </div>

      <button
        onClick={resetGame}
        className="mt-5 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset game
      </button>
    </div>
  );
}
