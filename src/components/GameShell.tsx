"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Volume2, VolumeX, Users } from "lucide-react";
import type { GameMeta } from "@/lib/types";
import { categoryMeta } from "@/lib/types";
import { NeonBackground } from "./NeonBackground";
import { isMuted, setMuted, sfx } from "@/lib/sound";
import { Chip } from "./ui/primitives";

function MuteToggle() {
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  return (
    <button
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
        if (!next) sfx.click();
      }}
      className="glass rounded-full p-2.5 text-white/70 hover:text-white transition-colors"
      aria-label={muted ? "Unmute" : "Mute"}
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}

/** Themed frame around every game: back nav, header chrome, animated backdrop. */
export function GameShell({ meta, children }: { meta: GameMeta; children: ReactNode }) {
  const cat = categoryMeta(meta.category);

  return (
    <div className="relative min-h-dvh flex flex-col">
      <NeonBackground accent={cat.hex} />

      <header className="sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="glass rounded-full p-2.5 text-white/80 hover:text-white transition-colors"
            aria-label="Back to games"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{meta.emoji}</span>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl leading-none truncate" style={{ color: cat.hex }}>
                {meta.title}
              </h1>
              <span className="text-[0.7rem] uppercase tracking-widest text-white/40">{cat.label}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Chip className="hidden sm:inline-flex" color={cat.hex}>
              <Users size={12} /> {meta.players}
            </Chip>
            <MuteToggle />
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
      >
        {children}
      </motion.main>

      <footer className="px-4 py-4 text-center text-[0.7rem] text-white/25">
        {meta.needs && meta.needs.length > 0 && <span>Needs: {meta.needs.join(" · ")} — </span>}
        Please drink responsibly. Know your limits. 🥂
      </footer>
    </div>
  );
}
