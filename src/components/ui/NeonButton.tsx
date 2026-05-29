"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { sfx } from "@/lib/sound";

type Variant = "primary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-br from-neon-pink to-neon-violet border-white/20 shadow-[0_0_24px_-6px_#ff2d95]",
  success:
    "text-ink bg-gradient-to-br from-neon-lime to-neon-teal border-white/20 shadow-[0_0_24px_-6px_#2de2c0]",
  danger:
    "text-white bg-gradient-to-br from-neon-coral to-neon-pink border-white/20 shadow-[0_0_24px_-6px_#ff5e5b]",
  ghost: "text-white/90 glass hover:bg-white/10",
};

const SIZES: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm rounded-xl",
  md: "px-5 py-2.5 text-base rounded-2xl",
  lg: "px-7 py-3.5 text-lg rounded-2xl",
};

export interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  /** play a click sound (default true) */
  sound?: boolean;
  fullWidth?: boolean;
  /** override the variant gradient with a solid accent hex (dark text) */
  accent?: string;
}

export function NeonButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
  disabled,
  type = "button",
  sound = true,
  fullWidth,
  accent,
}: NeonButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.04, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      onClick={() => {
        if (disabled) return;
        if (sound) sfx.click();
        onClick?.();
      }}
      style={
        accent
          ? { background: accent, color: "#1a0a00", borderColor: accent, boxShadow: `0 0 24px -6px ${accent}` }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden font-semibold tracking-wide border select-none",
        "transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {!disabled && <span className="sheen-overlay rounded-[inherit]" />}
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
