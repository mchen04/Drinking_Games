"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  RequirePlayers,
  GameHeading,
  PlayerChip,
  DrinkCallout,
  NeonButton,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { randInt } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { drinkRain } from "@/lib/confetti";

const ACCENT = "#ffb627";
const NUM_GLASSES = 6;

/** Glass icon — either safe (empty) or loaded (with a splash). */
function GlassIcon({
  index,
  state,
  active,
  onClick,
}: {
  index: number;
  state: "hidden" | "safe" | "loaded" | "picked";
  active: boolean;
  onClick: () => void;
}) {
  const handleClick = useCallback(() => {
    if (!active || state !== "hidden") return;
    onClick();
  }, [active, state, onClick]);

  const bgColor =
    state === "loaded"
      ? "#ff2d95"
      : state === "safe"
        ? "#2de2c0"
        : state === "picked"
          ? "#555"
          : ACCENT;

  const glowColor =
    state === "loaded"
      ? "#ff2d95"
      : state === "safe"
        ? "#2de2c0"
        : state === "picked"
          ? "transparent"
          : active
            ? ACCENT
            : "transparent";

  const shakeVariants = {
    loaded: {
      x: [0, -8, 8, -8, 8, -4, 4, 0],
      rotate: [0, -6, 6, -6, 6, -3, 3, 0],
      transition: { duration: 0.55, ease: "easeInOut" as const },
    },
    safe: {
      y: [0, -14, 0],
      rotate: [0, -15, 0],
      transition: { duration: 0.35, ease: "easeOut" as const },
    },
    idle: { x: 0, y: 0, rotate: 0 },
  };

  const variant =
    state === "loaded" ? "loaded" : state === "safe" ? "safe" : "idle";

  return (
    <motion.button
      variants={shakeVariants}
      animate={variant}
      onClick={handleClick}
      disabled={!active || state !== "hidden"}
      whileHover={active && state === "hidden" ? { scale: 1.12 } : {}}
      whileTap={active && state === "hidden" ? { scale: 0.94 } : {}}
      className="relative flex flex-col items-center gap-1 focus:outline-none"
      style={{ cursor: active && state === "hidden" ? "pointer" : "default" }}
      aria-label={`Glass ${index + 1}`}
    >
      {/* Shot glass SVG */}
      <motion.div
        className="relative"
        style={{
          filter:
            state !== "picked"
              ? `drop-shadow(0 0 8px ${glowColor})`
              : undefined,
        }}
      >
        <svg
          width="52"
          height="68"
          viewBox="0 0 52 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Glass body */}
          <path
            d="M10 6 L6 62 Q6 66 10 66 L42 66 Q46 66 46 62 L42 6 Z"
            fill={
              state === "picked"
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.10)"
            }
            stroke={
              state === "picked"
                ? "rgba(255,255,255,0.12)"
                : `${bgColor}99`
            }
            strokeWidth="2"
          />
          {/* Liquid fill */}
          {state !== "picked" && (
            <path
              d="M11.5 22 L8.5 62 Q8.5 64 10 64 L42 64 Q43.5 64 43.5 62 L40.5 22 Z"
              fill={
                state === "loaded"
                  ? "#ff2d9588"
                  : state === "safe"
                    ? "#2de2c088"
                    : `${ACCENT}55`
              }
            />
          )}
          {/* Rim highlight */}
          <line
            x1="10"
            y1="6"
            x2="42"
            y2="6"
            stroke={state === "picked" ? "rgba(255,255,255,0.10)" : bgColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Number badge */}
        {state === "hidden" && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: ACCENT, color: "#1a0900" }}
          >
            {index + 1}
          </span>
        )}

        {/* State icon overlay */}
        {state === "safe" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-xl"
          >
            ✓
          </motion.span>
        )}
        {state === "loaded" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center text-xl"
          >
            💀
          </motion.span>
        )}
      </motion.div>

      <span
        className="text-[10px] font-semibold"
        style={{
          color:
            state === "loaded"
              ? "#ff2d95"
              : state === "safe"
                ? "#2de2c0"
                : state === "picked"
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.5)",
        }}
      >
        {state === "loaded" ? "LOADED" : state === "safe" ? "safe" : state === "picked" ? "—" : `pick`}
      </span>
    </motion.button>
  );
}

// ──────────────────────────────────────────────
// Inner game (after RequirePlayers is satisfied)
// ──────────────────────────────────────────────

type GlassState = "hidden" | "safe" | "loaded" | "picked";
type Phase = "picking" | "result";

function RouletteGame({ players }: { players: Player[] }) {
  const [loadedIdx, setLoadedIdx] = useState<number>(() => randInt(0, NUM_GLASSES - 1));
  const [glasses, setGlasses] = useState<GlassState[]>(() =>
    Array(NUM_GLASSES).fill("hidden") as GlassState[],
  );
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>("picking");
  const [loser, setLoser] = useState<Player | null>(null);
  const [roundNum, setRoundNum] = useState(1);

  const currentPlayer = players[turn % players.length];

  function pickGlass(idx: number) {
    if (phase !== "picking") return;
    sfx.click();

    const isLoaded = idx === loadedIdx;

    setGlasses((prev) => {
      const next = [...prev] as GlassState[];
      next[idx] = isLoaded ? "loaded" : "safe";
      return next;
    });

    if (isLoaded) {
      // Dramatic loss
      setTimeout(() => {
        sfx.buzz();
        drinkRain();
        setLoser(currentPlayer);
        // Reveal all remaining hidden glasses as "picked" (dimmed)
        setGlasses((prev) => prev.map((s) => (s === "hidden" ? "picked" : s)) as GlassState[]);
        setPhase("result");
      }, 120);
    } else {
      // Safe — green glow + ding then advance turn
      setTimeout(() => {
        sfx.ding();
      }, 80);
      setTimeout(() => {
        setTurn((t) => t + 1);
        setPhase("picking"); // stay in picking phase
      }, 950);
    }
  }

  function reload() {
    sfx.whoosh();
    setLoadedIdx(randInt(0, NUM_GLASSES - 1));
    setGlasses(Array(NUM_GLASSES).fill("hidden") as GlassState[]);
    setLoser(null);
    setPhase("picking");
    setTurn((t) => t + 1);
    setRoundNum((r) => r + 1);
  }

  const safeCount = glasses.filter((g) => g === "safe").length;
  const pickedCount = glasses.filter((g) => g === "picked" || g === "safe" || g === "loaded").length;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Russian Roulette"
        subtitle={`Round ${roundNum} · One glass is loaded — dare to pick?`}
        accent={ACCENT}
      />

      {/* Player chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={phase === "picking" && i === turn % players.length}
          />
        ))}
      </div>

      {/* Turn indicator */}
      <AnimatePresence mode="wait">
        {phase === "picking" && (
          <motion.p
            key={`turn-${turn}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-5 text-sm"
          >
            <span className="font-bold" style={{ color: currentPlayer.color }}>
              {currentPlayer.name}
            </span>
            <span className="text-white/60"> — tap a glass</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Shot glasses grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-5 mb-8">
        {glasses.map((state, i) => (
          <GlassIcon
            key={i}
            index={i}
            state={state}
            active={phase === "picking"}
            onClick={() => pickGlass(i)}
          />
        ))}
      </div>

      {/* Result / callout area */}
      <div className="min-h-[7rem] w-full max-w-md flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "result" && loser && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex flex-col items-center gap-4"
            >
              <DrinkCallout
                text={`${loser.name} got it! DRINK!`}
                accent="#ff2d95"
              />
              <p className="text-white/55 text-sm text-center">
                {safeCount} glass{safeCount !== 1 ? "es" : ""} survived before the loaded one was found.
              </p>
              <NeonButton onClick={reload} size="lg" variant="danger">
                <RotateCcw size={16} className="inline mr-1.5" />
                Reload &amp; continue
              </NeonButton>
            </motion.div>
          )}

          {phase === "picking" && pickedCount > 0 && (
            <motion.p
              key={`progress-${pickedCount}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/35 text-xs text-center"
            >
              {NUM_GLASSES - pickedCount} glass{NUM_GLASSES - pickedCount !== 1 ? "es" : ""} remaining
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Default export — wrapped with RequirePlayers
// ──────────────────────────────────────────────

export default function RussianRoulette() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players) => <RouletteGame players={players} />}
    </RequirePlayers>
  );
}
