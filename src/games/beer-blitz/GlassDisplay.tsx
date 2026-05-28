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

interface GlassDisplayProps {
  fillPct: number;
  phase: "idle" | "filling" | "result-hit" | "result-miss" | "overflow" | "gameover";
  glassControls: AnimationControls;
}

export function GlassDisplay({ fillPct, phase, glassControls }: GlassDisplayProps) {
  const fillHeightPx = (fillPct / 100) * GLASS_H;
  const isActive = phase === "filling";

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
        {/* Liquid fill — animates from bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: fillHeightPx,
            background: `linear-gradient(180deg, ${ACCENT}cc, ${FILL_COLOR_AMBER})`,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
          transition={{ duration: 0 }}
        />

        {/* Foam on top of liquid */}
        {fillPct > 2 && (
          <motion.div
            className="absolute left-0 right-0"
            style={{
              bottom: fillHeightPx,
              height: 8,
              background: "rgba(255,255,255,0.55)",
              borderRadius: 6,
              filter: "blur(2px)",
            }}
            transition={{ duration: 0 }}
          />
        )}

        {/* Target band */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            bottom: BAND_BOT_PX,
            height: BAND_HEIGHT_PX,
            background: `${ACCENT}40`,
            borderTop: `2px solid ${ACCENT}cc`,
            borderBottom: `2px solid ${ACCENT}cc`,
            boxShadow: `inset 0 0 12px ${ACCENT}55`,
          }}
        />

        {/* Band label */}
        <div
          className="absolute right-0 left-0 flex justify-center pointer-events-none"
          style={{ bottom: BAND_BOT_PX + BAND_HEIGHT_PX / 2 - 8 }}
        >
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: `${ACCENT}dd`, textShadow: `0 0 8px ${ACCENT}` }}
          >
            STOP HERE
          </span>
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
