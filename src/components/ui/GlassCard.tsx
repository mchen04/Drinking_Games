"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  /** glow color (hex). Adds a soft accent ring. */
  glow?: string;
}

/** Frosted-glass surface with an optional neon glow ring. */
export function GlassCard({ children, className, glow, style, ...rest }: GlassCardProps) {
  return (
    <motion.div
      {...rest}
      style={{
        ...(glow
          ? { boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 40px -12px ${glow}` }
          : {}),
        ...style,
      }}
      className={cn("glass rounded-3xl", className)}
    >
      {children}
    </motion.div>
  );
}
