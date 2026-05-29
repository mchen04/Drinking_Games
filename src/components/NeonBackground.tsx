"use client";

import { motion } from "framer-motion";
import { NEON } from "@/lib/confetti";

// deterministic bubble field (no Math.random → no hydration mismatch)
const BUBBLES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  left: (i * 53) % 100,
  size: 6 + ((i * 13) % 22),
  delay: (i % 9) * 0.8,
  duration: 9 + ((i * 7) % 8),
  color: NEON[i % NEON.length],
}));

// deterministic twinkling star/sparkle field
const SPARKS = Array.from({ length: 22 }).map((_, i) => ({
  id: i,
  left: (i * 37 + 7) % 100,
  top: (i * 61 + 13) % 100,
  size: 2 + ((i * 5) % 4),
  delay: (i % 11) * 0.45,
  duration: 3 + ((i * 3) % 5),
  color: NEON[(i * 2) % NEON.length],
}));

/** Fixed full-viewport animated backdrop: aurora glow blobs, twinkling sparkles
 *  and rising bubbles. Purely decorative & pointer-transparent. */
export function NeonBackground({ accent }: { accent?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-grid">
      {/* drifting aurora blobs (scale + drift + soft opacity breathe) */}
      <motion.div
        className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full blur-3xl"
        style={{ background: accent ?? "#9d4edd" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0], scale: [1, 1.15, 0.92, 1], opacity: [0.28, 0.36, 0.22, 0.28] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full blur-3xl"
        style={{ background: "#18e7ff" }}
        animate={{ x: [0, -50, 20, 0], y: [0, 30, -40, 0], scale: [1, 0.9, 1.12, 1], opacity: [0.22, 0.3, 0.18, 0.22] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full blur-3xl"
        style={{ background: "#ff2d95" }}
        animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1], opacity: [0.18, 0.26, 0.14, 0.18] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* a faint top-light conic shimmer that slowly rotates */}
      <motion.div
        className="absolute left-1/2 top-[-30%] w-[80vw] h-[80vw] -translate-x-1/2 rounded-full blur-3xl opacity-[0.07]"
        style={{
          background: `conic-gradient(from 0deg, ${accent ?? "#9d4edd"}, #18e7ff, #ff2d95, ${accent ?? "#9d4edd"})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* twinkling sparkles */}
      {SPARKS.map((s) => (
        <span
          key={`s${s.id}`}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 8px ${s.color}`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* rising bubbles */}
      {BUBBLES.map((b) => (
        <span
          key={`b${b.id}`}
          className="absolute bottom-0 rounded-full opacity-40"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background: b.color,
            boxShadow: `0 0 12px ${b.color}`,
            animation: `rise ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}

      {/* subtle vignette to focus the center stage */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(3,1,8,0.55) 100%)" }}
      />
    </div>
  );
}
