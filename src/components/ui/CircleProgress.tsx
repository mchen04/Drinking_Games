"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface CircleProgressProps {
  /** 0..1 fraction filled */
  fraction: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  /** centered content (time left, round number, icon) */
  children?: ReactNode;
  className?: string;
  /** seconds for the sweep tween (defaults to a snappy 0.25s) */
  tween?: number;
}

/** Shared circular countdown / progress ring used by the timer & verbal games. */
export function CircleProgress({
  fraction,
  size = 200,
  stroke = 12,
  color = "#9d4edd",
  trackColor = "rgba(255,255,255,0.08)",
  children,
  className,
  tween = 0.25,
}: CircleProgressProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fraction));
  const offset = circumference * (1 - clamped);

  return (
    <div className={className} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ ease: "linear", duration: tween }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
