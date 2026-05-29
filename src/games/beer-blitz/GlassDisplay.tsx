"use client";

import { AnimatePresence, motion, type AnimationControls } from "framer-motion";

// ─── Constants (re-exported so index.tsx shares the same values) ──────────────

export const ACCENT = "#9d4edd";
export const GLASS_H = 280;        // px — visual height of the fill area
export const BAND_SIZE = 0.18;
export const BAND_TOP_FRAC = 0.60;
export const BAND_BOT_FRAC = BAND_TOP_FRAC + BAND_SIZE;

// Derived pixel values (computed once).
export const BAND_BOT_PX = (1 - BAND_BOT_FRAC) * GLASS_H;
export const BAND_TOP_PX = (1 - BAND_TOP_FRAC) * GLASS_H;
export const BAND_HEIGHT_PX = BAND_TOP_PX - BAND_BOT_PX;

const FILL_COLOR_AMBER = "#ffb627";

// A handful of foam bubbles for the surface — positions are static, scale/opacity
// breathe while pouring (transform/opacity only → GPU friendly).
const BUBBLES = [
  { left: "18%", size: 7, delay: 0 },
  { left: "42%", size: 5, delay: 0.25 },
  { left: "63%", size: 8, delay: 0.5 },
  { left: "80%", size: 5, delay: 0.15 },
  { left: "30%", size: 6, delay: 0.4 },
];

// Overflow splash droplets — flung outward from the rim.
const SPLASH = [
  { x: -34, y: -10, r: 6 },
  { x: -18, y: -26, r: 4 },
  { x: 0, y: -32, r: 7 },
  { x: 20, y: -25, r: 5 },
  { x: 36, y: -8, r: 6 },
  { x: 28, y: 4, r: 4 },
  { x: -30, y: 6, r: 4 },
];

interface GlassDisplayProps {
  fillPct: number;
  phase: "idle" | "filling" | "result-hit" | "result-miss" | "overflow" | "gameover";
  glassControls: AnimationControls;
}

export function GlassDisplay({ fillPct, phase, glassControls }: GlassDisplayProps) {
  const fillHeightPx = (fillPct / 100) * GLASS_H;
  const isActive = phase === "filling";
  const inBandNow =
    isActive &&
    1 - fillPct / 100 >= BAND_TOP_FRAC &&
    1 - fillPct / 100 <= BAND_BOT_FRAC;

  return (
    <motion.div animate={glassControls} className="relative">
      {/* Glass shape */}
      <div
        className="relative overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-white/25 glass"
        style={{
          width: 120,
          height: GLASS_H,
          boxShadow: isActive
            ? `0 0 32px -8px ${ACCENT}80, inset 0 0 0 1px ${ACCENT}30`
            : "inset 0 0 0 1px #ffffff18",
          transition: "box-shadow 0.3s",
        }}
      >
        {/* Liquid fill — animates from bottom. Wobbles gently while pouring. */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{
            height: fillHeightPx,
            background: `linear-gradient(180deg, ${ACCENT}cc, ${FILL_COLOR_AMBER})`,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
          animate={isActive ? { scaleX: [1, 1.015, 1] } : { scaleX: 1 }}
          transition={
            isActive
              ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          {/* Travelling sheen down the surface of the liquid */}
          {isActive && (
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%)",
              }}
              animate={{ y: ["-100%", "120%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        {/* Foam on top of liquid — with breathing bubbles while pouring */}
        {fillPct > 2 && (
          <motion.div
            className="absolute left-0 right-0"
            style={{
              bottom: fillHeightPx,
              height: 10,
              background: "rgba(255,255,255,0.6)",
              borderRadius: 6,
              filter: "blur(2px)",
            }}
            animate={isActive ? { opacity: [0.75, 1, 0.75] } : { opacity: 0.85 }}
            transition={
              isActive
                ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0 }
            }
          >
            {isActive &&
              BUBBLES.map((b, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-white/85"
                  style={{ left: b.left, top: -b.size / 2, width: b.size, height: b.size }}
                  animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 0.9, 0.4] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: b.delay,
                  }}
                />
              ))}
          </motion.div>
        )}

        {/* Target band — glows brighter when the surface is currently inside it */}
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            bottom: BAND_BOT_PX,
            height: BAND_HEIGHT_PX,
            background: `${ACCENT}40`,
            borderTop: `2px solid ${ACCENT}cc`,
            borderBottom: `2px solid ${ACCENT}cc`,
          }}
          animate={{
            boxShadow: inBandNow
              ? `inset 0 0 22px ${ACCENT}, 0 0 18px ${ACCENT}aa`
              : `inset 0 0 12px ${ACCENT}55`,
          }}
          transition={{ duration: 0.18 }}
        />

        {/* Band label */}
        <div
          className="absolute right-0 left-0 flex justify-center pointer-events-none"
          style={{ bottom: BAND_BOT_PX + BAND_HEIGHT_PX / 2 - 8 }}
        >
          <motion.span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: `${ACCENT}dd`, textShadow: `0 0 8px ${ACCENT}` }}
            animate={inBandNow ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={
              inBandNow
                ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            STOP HERE
          </motion.span>
        </div>

        {/* Overflow flash */}
        <AnimatePresence>
          {phase === "overflow" && (
            <motion.div
              className="absolute inset-0 rounded-b-3xl rounded-t-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ duration: 0.5 }}
              style={{ background: "#ff5e5b" }}
            />
          )}
        </AnimatePresence>

        {/* Success flash */}
        <AnimatePresence>
          {phase === "result-hit" && (
            <motion.div
              className="absolute inset-0 rounded-b-3xl rounded-t-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0] }}
              transition={{ duration: 0.4 }}
              style={{ background: "#b6ff3c" }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Overflow splash — droplets flung over the rim (outside the glass clip) */}
      <AnimatePresence>
        {phase === "overflow" && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none">
            {SPLASH.map((d, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: d.r * 2,
                  height: d.r * 2,
                  background: `linear-gradient(180deg, ${ACCENT}, ${FILL_COLOR_AMBER})`,
                  boxShadow: `0 0 8px ${ACCENT}aa`,
                }}
                initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                animate={{ x: d.x, y: d.y, scale: 1, opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut", delay: i * 0.015 }}
              />
            ))}
            {/* Foam crown bursting over the rim */}
            <motion.span
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/80"
              style={{ width: 70, height: 16, filter: "blur(3px)" }}
              initial={{ scale: 0.4, opacity: 0, y: 4 }}
              animate={{ scale: [0.4, 1.2, 1], opacity: [0, 0.9, 0], y: -6 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Speed indicator tick marks on the side */}
      <div
        className="absolute top-0 bottom-0 flex flex-col justify-between py-2"
        style={{ left: -24, width: 12 }}
      >
        {[100, 75, 50, 25, 0].map((mark) => (
          <div key={mark} className="flex items-center gap-1">
            <div className="w-2 h-px bg-white/20" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
