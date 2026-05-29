"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { PromptDeck } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MILD, SPICY, EXTRA } from "./data";

const LEVELS = [
  { id: "mild", label: "Mild", items: MILD, accent: "#2de2c0" },
  { id: "spicy", label: "Spicy", items: SPICY, accent: "#ffb627" },
  { id: "extra", label: "Extra 🔥", items: EXTRA, accent: "#ff2d95" },
] as const;

export default function NeverHaveIEver() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(LEVELS[0]);

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      <p className="text-center text-white/50 text-sm max-w-md mb-3">
        Read the card aloud. <span className="text-white/80">If you&apos;ve done it, take a drink.</span> Last
        one with secrets intact wins (and is probably lying).
      </p>

      <div className="flex gap-1.5 mb-4 glass rounded-full p-1">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l)}
            className={cn(
              "relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
              level.id === l.id ? "text-ink" : "text-white/60 hover:text-white",
            )}
          >
            {level.id === l.id && (
              <motion.span
                layoutId="nhie-level-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: l.accent }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative z-10">{l.label}</span>
          </button>
        ))}
      </div>

      <PromptDeck
        key={level.id}
        items={level.items}
        prefix="Never have I ever…"
        accent={level.accent}
        nextLabel="Next confession"
      />
    </motion.div>
  );
}
