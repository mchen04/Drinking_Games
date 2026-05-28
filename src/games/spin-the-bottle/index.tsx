"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  RequirePlayers,
  GameHeading,
  DrinkCallout,
  NeonButton,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { pickRandom, randInt } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { drinkRain } from "@/lib/confetti";
import { DARES } from "./data";

const ACCENT = "#ffb627";

export default function SpinTheBottle() {
  return (
    <RequirePlayers min={3} accent={ACCENT}>
      {(players) => <Game players={players} />}
    </RequirePlayers>
  );
}

// ─── Geometry helpers ──────────────────────────────────────────────────────────

/** Return the CSS position (center of player chip) for index i out of n. */
function playerPos(i: number, n: number, r: number): { x: number; y: number } {
  // angle 0 = top, going clockwise; subtract π/2 so 0 is at the top
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

/**
 * The bottle graphic points UP (0°) in its natural state.
 * A player at position i is placed at angle (2π·i/n − π/2) from the center.
 * We need the bottle's tip (↑) to point at that player, so targetAngle = that
 * angle converted to degrees, plus several full spins for drama.
 */
function targetRotation(
  playerIndex: number,
  playerCount: number,
  currentRotation: number,
  spinRounds: number,
): number {
  const playerAngleDeg =
    ((360 * playerIndex) / playerCount - 90 + 360) % 360;
  // Ensure forward spin: add enough full rotations so we spin at least spinRounds times
  const base = Math.ceil(currentRotation / 360) * 360 + spinRounds * 360;
  return base + playerAngleDeg;
}

// ─── Main game ────────────────────────────────────────────────────────────────

function Game({ players }: { players: Player[] }) {
  const controls = useAnimationControls();
  const currentRotationRef = useRef(0);
  const mountedRef = useRef(true);
  const [spinning, setSpinning] = useState(false);
  const [chosen, setChosen] = useState<Player | null>(null);
  const [dare, setDare] = useState<string>("");
  const [spunOnce, setSpunOnce] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Responsive radius: smaller on mobile
  const RADIUS = 130;

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setChosen(null);
    setDare("");
    setSpunOnce(true);

    const pickedIndex = randInt(0, players.length - 1);
    const target = targetRotation(
      pickedIndex,
      players.length,
      currentRotationRef.current,
      5,
    );

    sfx.whoosh();

    void controls
      .start({
        rotate: target,
        transition: {
          duration: 3.2,
          ease: [0.22, 1, 0.36, 1], // easeOutQuint-ish
        },
      })
      .then(() => {
        if (!mountedRef.current) return;
        currentRotationRef.current = target;
        sfx.ding();
        const picked = players[pickedIndex];
        const pickedDare = pickRandom(DARES);
        setChosen(picked);
        setDare(pickedDare);
        drinkRain();
        setSpinning(false);
      });
  }, [spinning, players, controls]);

  function reset() {
    setChosen(null);
    setDare("");
    setSpunOnce(false);
    setSpinning(false);
    currentRotationRef.current = 0;
    void controls.set({ rotate: 0 });
  }

  // Center of the circle arena in pixels (the container is 2R + chip-size wide)
  const chipSize = 48; // px, approximate player chip size
  const arenaSize = (RADIUS + chipSize) * 2;

  const playerPositions = useMemo(
    () => players.map((_, i) => playerPos(i, players.length, RADIUS)),
    [players, RADIUS],
  );

  return (
    <div className="flex flex-col items-center select-none">
      <GameHeading
        title="Spin the Bottle"
        subtitle="Spin 🍾 — it lands on someone. They get a dare or take a drink."
        accent={ACCENT}
      />

      {/* Circle arena */}
      <div
        className="relative flex items-center justify-center mx-auto"
        style={{ width: arenaSize, height: arenaSize }}
      >
        {/* Player chips around the circle */}
        {players.map((p, i) => {
          const pos = playerPositions[i];
          const isChosen = chosen?.id === p.id;
          return (
            <motion.div
              key={p.id}
              className="absolute flex flex-col items-center gap-1"
              style={{
                left: arenaSize / 2 + pos.x - chipSize / 2,
                top: arenaSize / 2 + pos.y - chipSize / 2,
                width: chipSize,
              }}
              animate={
                isChosen
                  ? { scale: 1.22 }
                  : { scale: 1 }
              }
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              {/* Avatar circle */}
              <div
                className="rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  width: chipSize,
                  height: chipSize,
                  background: isChosen ? p.color : `${p.color}33`,
                  border: `2px solid ${p.color}`,
                  boxShadow: isChosen
                    ? `0 0 20px 4px ${p.color}, 0 0 40px 8px ${p.color}55`
                    : `0 0 8px 1px ${p.color}44`,
                  color: isChosen ? "#1a0a00" : p.color,
                  transition: "background 0.3s, box-shadow 0.3s",
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              {/* Name label */}
              <span
                className="text-[10px] font-semibold leading-tight text-center w-16 truncate"
                style={{ color: isChosen ? p.color : "rgba(255,255,255,0.6)" }}
              >
                {p.name}
              </span>
            </motion.div>
          );
        })}

        {/* Bottle in the center */}
        <motion.div
          animate={controls}
          className="absolute"
          style={{
            // Position dead-center; let framer-motion rotate around this center
            left: arenaSize / 2 - 16,
            top: arenaSize / 2 - 16,
            width: 32,
            height: 32,
            fontSize: 32,
            lineHeight: 1,
            transformOrigin: "center center",
            cursor: spinning ? "default" : "pointer",
            filter: spinning
              ? `drop-shadow(0 0 12px ${ACCENT})`
              : `drop-shadow(0 0 6px ${ACCENT}88)`,
          }}
          onClick={spin}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              spin();
            }
          }}
          role="button"
          tabIndex={spinning ? -1 : 0}
          aria-label="Spin the bottle"
          title="Click to spin"
        >
          🍾
        </motion.div>
      </div>

      {/* Result area */}
      <div className="mt-4 min-h-[7rem] flex flex-col items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          {chosen && !spinning ? (
            <motion.div
              key={chosen.id + dare}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <DrinkCallout
                text={`${chosen.name}, it's your turn!`}
                accent={ACCENT}
              />
              <p
                className="glass-strong rounded-2xl px-5 py-3 text-center text-white/85 text-sm max-w-xs"
                style={{ boxShadow: `0 0 28px -10px ${ACCENT}` }}
              >
                {dare}
              </p>
            </motion.div>
          ) : !spunOnce ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/40 text-sm text-center"
            >
              Tap the bottle — or hit Spin — to begin.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-3">
        <NeonButton onClick={spin} size="lg" accent="#ffb627" disabled={spinning}>
          {spinning ? "Spinning…" : spunOnce ? "Spin again" : "Spin!"}
        </NeonButton>
      </div>

      <button
        onClick={reset}
        className="mt-6 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset
      </button>
    </div>
  );
}
