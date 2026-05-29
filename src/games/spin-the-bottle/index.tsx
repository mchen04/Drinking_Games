"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { RequirePlayers, DrinkCallout, NeonButton } from "@/components/ui";
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
    <motion.div
      className="flex flex-col items-center select-none"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-white/50 text-sm text-center mb-2">
        Spin 🍾 — it lands on someone. They get a dare or take a drink.
      </p>

      {/* Circle arena — scaled down on short/narrow viewports so it always fits */}
      <div
        className="origin-center scale-[0.74] sm:scale-100 -my-6 sm:my-0"
        style={{ width: arenaSize, height: arenaSize }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: arenaSize, height: arenaSize }}
        >
          {/* Ambient arena glow */}
          <motion.div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: RADIUS * 1.7,
              height: RADIUS * 1.7,
              background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
            }}
            animate={
              spinning
                ? { scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }
                : { scale: 1, opacity: 0.4 }
            }
            transition={{
              duration: 1.2,
              repeat: spinning ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Orbit ring */}
          <div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: RADIUS * 2,
              height: RADIUS * 2,
              border: `1px dashed ${ACCENT}33`,
            }}
          />

          {/* Player chips around the circle */}
          {players.map((p, i) => {
            const pos = playerPositions[i];
            const isChosen = chosen?.id === p.id;
            return (
              <motion.div
                key={p.id}
                layout
                className="absolute flex flex-col items-center gap-1"
                style={{
                  left: arenaSize / 2 + pos.x - chipSize / 2,
                  top: arenaSize / 2 + pos.y - chipSize / 2,
                  width: chipSize,
                }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={
                  isChosen
                    ? { opacity: 1, scale: [1, 1.3, 1.22] }
                    : { opacity: 1, scale: 1 }
                }
                transition={
                  isChosen
                    ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
                    : { type: "spring", stiffness: 280, damping: 20 }
                }
              >
                {/* Avatar circle */}
                <motion.div
                  className="rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    width: chipSize,
                    height: chipSize,
                    background: isChosen ? p.color : `${p.color}33`,
                    border: `2px solid ${p.color}`,
                    color: isChosen ? "#1a0a00" : p.color,
                    transition: "background 0.3s, color 0.3s",
                  }}
                  animate={
                    isChosen
                      ? {
                          boxShadow: [
                            `0 0 20px 4px ${p.color}, 0 0 40px 8px ${p.color}55`,
                            `0 0 32px 8px ${p.color}, 0 0 60px 14px ${p.color}66`,
                            `0 0 20px 4px ${p.color}, 0 0 40px 8px ${p.color}55`,
                          ],
                        }
                      : { boxShadow: `0 0 8px 1px ${p.color}44` }
                  }
                  transition={
                    isChosen
                      ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                >
                  {p.name.charAt(0).toUpperCase()}
                </motion.div>
                {/* Name label */}
                <span
                  className="text-[10px] font-semibold leading-tight text-center w-16 truncate"
                  style={{
                    color: isChosen ? p.color : "rgba(255,255,255,0.6)",
                  }}
                >
                  {p.name}
                </span>
              </motion.div>
            );
          })}

          {/* Spin glow trail — fades in behind the bottle while spinning */}
          <AnimatePresence>
            {spinning && (
              <motion.div
                key="trail"
                aria-hidden
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: arenaSize / 2 - RADIUS,
                  top: arenaSize / 2 - RADIUS,
                  width: RADIUS * 2,
                  height: RADIUS * 2,
                  background: `conic-gradient(from -90deg, ${ACCENT}00 0deg, ${ACCENT}00 300deg, ${ACCENT}66 350deg, ${ACCENT}cc 360deg)`,
                  maskImage:
                    "radial-gradient(circle, transparent 38%, #000 40%, #000 50%, transparent 52%)",
                  WebkitMaskImage:
                    "radial-gradient(circle, transparent 38%, #000 40%, #000 50%, transparent 52%)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0.85] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

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
                ? `drop-shadow(0 0 14px ${ACCENT}) drop-shadow(0 0 28px ${ACCENT}88)`
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

          {/* Center hub dot */}
          <div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              left: arenaSize / 2 - 4,
              top: arenaSize / 2 - 4,
              width: 8,
              height: 8,
              background: ACCENT,
              boxShadow: `0 0 10px 2px ${ACCENT}`,
            }}
          />
        </div>
      </div>

      {/* Result area */}
      <div className="mt-2 min-h-[5.5rem] flex flex-col items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          {chosen && !spinning ? (
            <motion.div
              key={chosen.id + dare}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center gap-2.5 w-full"
            >
              <motion.div
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                <DrinkCallout
                  text={`${chosen.name}, it's your turn!`}
                  accent={ACCENT}
                />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="glass-strong rounded-2xl px-5 py-2.5 text-center text-white/85 text-sm max-w-xs"
                style={{ boxShadow: `0 0 28px -10px ${ACCENT}` }}
              >
                {dare}
              </motion.p>
            </motion.div>
          ) : !spunOnce ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/40 text-sm text-center"
            >
              Tap the bottle — or hit Spin — to begin.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="mt-3 flex gap-3">
        <NeonButton onClick={spin} size="lg" accent="#ffb627" disabled={spinning}>
          {spinning ? "Spinning…" : spunOnce ? "Spin again" : "Spin!"}
        </NeonButton>
      </div>

      <button
        onClick={reset}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
      >
        <RotateCcw size={13} /> reset
      </button>
    </motion.div>
  );
}
