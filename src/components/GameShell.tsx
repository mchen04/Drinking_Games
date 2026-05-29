"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
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
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
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
    </motion.button>
  );
}

/**
 * Themed frame around every game. The whole frame is locked to the viewport
 * (`h-[100dvh]`, no page scroll): a compact header on top, a flexible play
 * stage in the middle that centers the game and only scrolls *internally* if a
 * game truly overflows, and a slim footer. The net effect — every game fits on
 * one screen and you just play.
 */
export function GameShell({ meta, children }: { meta: GameMeta; children: ReactNode }) {
  const cat = categoryMeta(meta.category);

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      <NeonBackground accent={cat.hex} />

      <header className="shrink-0 z-30 px-3 py-2.5 sm:px-6 sm:py-3 [@media(max-height:520px)]:py-1.5">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="glass rounded-full p-2.5 text-white/80 hover:text-white transition-colors active:scale-90"
            aria-label="Back to games"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <motion.span
              className="text-2xl"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 14, delay: 0.05 }}
            >
              {meta.emoji}
            </motion.span>
            <div className="min-w-0">
              <h1
                className="font-display text-base sm:text-xl leading-none truncate neon-text"
                style={{ color: cat.hex }}
              >
                {meta.title}
              </h1>
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-white/40 [@media(max-height:430px)]:hidden">
                {cat.label}
              </span>
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
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col"
      >
        <div className="game-stage py-3 sm:py-4">{children}</div>
      </motion.main>

      <footer className="shrink-0 px-4 py-1.5 [@media(max-height:520px)]:py-0.5 text-center text-[0.62rem] sm:text-[0.68rem] [@media(max-height:430px)]:text-[0.55rem] text-white/25">
        {meta.needs && meta.needs.length > 0 && (
          <span className="hidden lg:inline">Needs: {meta.needs.join(" · ")} — </span>
        )}
        Please drink responsibly. 🥂
      </footer>
    </div>
  );
}
