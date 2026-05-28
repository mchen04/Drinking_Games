"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Users } from "lucide-react";
import type { GameMeta } from "@/lib/types";
import { categoryMeta } from "@/lib/types";
import { sfx } from "@/lib/sound";

const DIFF_COLOR: Record<string, string> = {
  Chill: "#2de2c0",
  Wild: "#ffb627",
  Chaos: "#ff5e5b",
};

/** Interactive game tile with pointer-tracked 3D tilt and a category glow. */
export function GameCard({ game }: { game: GameMeta }) {
  const cat = categoryMeta(game.category);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 250, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 250, damping: 18 });

  return (
    <Link href={`/game/${game.id}`} onClick={() => sfx.flip()}>
      <motion.article
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative glass rounded-3xl p-5 h-full overflow-hidden cursor-pointer"
      >
        {/* glow wash on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(22rem 22rem at 50% -20%, ${cat.hex}33, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: `inset 0 0 0 1px ${cat.hex}66, 0 0 40px -12px ${cat.hex}` }}
        />

        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl drop-shadow-lg">{game.emoji}</span>
            <span
              className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ color: DIFF_COLOR[game.difficulty], background: `${DIFF_COLOR[game.difficulty]}1a` }}
            >
              {game.difficulty}
            </span>
          </div>

          <h3 className="font-display text-lg text-white leading-tight mb-1">{game.title}</h3>
          <p className="text-sm text-white/50 leading-snug mb-4 min-h-[2.5rem]">{game.tagline}</p>

          <div className="flex items-center gap-2 text-xs">
            <span
              className="px-2 py-1 rounded-full font-medium"
              style={{ color: cat.hex, background: `${cat.hex}1a` }}
            >
              {cat.emoji} {cat.label}
            </span>
            <span className="ml-auto flex items-center gap-1 text-white/40">
              <Users size={12} /> {game.players}
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
