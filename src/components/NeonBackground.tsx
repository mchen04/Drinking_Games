"use client";

import { motion } from "framer-motion";

// deterministic bubble field (no Math.random → no hydration mismatch)
const BUBBLES = Array.from({ length: 18 }).map((_, i) => ({
  left: (i * 53) % 100,
  size: 6 + ((i * 13) % 22),
  delay: (i % 9) * 0.8,
  duration: 9 + ((i * 7) % 8),
  color: ["#ff2d95", "#18e7ff", "#b6ff3c", "#ffb627", "#9d4edd"][i % 5],
}));

/** Fixed full-viewport animated backdrop: drifting glow blobs + rising bubbles. */
export function NeonBackground({ accent }: { accent?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-grid">
      {/* drifting blobs */}
      <motion.div
        className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-30"
        style={{ background: accent ?? "#9d4edd" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-25"
        style={{ background: "#18e7ff" }}
        animate={{ x: [0, -50, 20, 0], y: [0, 30, -40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-20"
        style={{ background: "#ff2d95" }}
        animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* rising bubbles */}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
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
    </div>
  );
}
