"use client";

import { useState } from "react";
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
    <div className="flex flex-col items-center">
      <p className="text-center text-white/55 max-w-md mb-6">
        Read the card aloud. <span className="text-white">If you&apos;ve done it, take a drink.</span> Last
        one with secrets intact wins (and is probably lying).
      </p>

      <div className="flex gap-2 mb-8 glass rounded-full p-1">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
              level.id === l.id ? "text-ink" : "text-white/60 hover:text-white",
            )}
            style={level.id === l.id ? { background: l.accent } : undefined}
          >
            {l.label}
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
    </div>
  );
}
