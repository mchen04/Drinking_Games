"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, Heart } from "lucide-react";
import { GAMES } from "@/games/registry";
import { CATEGORIES, categoryMeta, type Category } from "@/lib/types";
import { GameCard } from "./GameCard";
import { NeonBackground } from "./NeonBackground";
import { cn } from "@/lib/cn";

export function Dashboard() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Category | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((g) => {
      const matchCat = active === "all" || g.category === active;
      const matchQ =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        categoryMeta(g.category).label.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, active]);

  return (
    <div className="relative min-h-dvh">
      <NeonBackground />

      {/* ---------------------------------------------------------- hero */}
      <header className="relative px-4 pt-16 pb-10 sm:pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs uppercase tracking-[0.25em] text-white/60"
        >
          🍸 {GAMES.length} games · {CATEGORIES.length} flavors
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-6xl sm:text-8xl font-extrabold leading-[0.9]"
        >
          <span className="bg-gradient-to-br from-neon-pink via-neon-violet to-neon-cyan bg-clip-text text-transparent neon-text">
            POUR
          </span>
          <br />
          <span className="bg-gradient-to-br from-neon-cyan via-neon-lime to-neon-amber bg-clip-text text-transparent neon-text">
            DECISIONS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-5 text-lg sm:text-xl text-white/60 max-w-xl mx-auto text-balance"
        >
          Every drinking game worth playing — cards, dice, dares, spinners & trivia.
          Pick your poison. 🥂
        </motion.p>
      </header>

      {/* ------------------------------------------------- search + filters */}
      <div className="sticky top-0 z-30 px-4 py-4 backdrop-blur-xl bg-ink/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="relative max-w-md mx-auto mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games…"
              className="w-full glass rounded-2xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-neon-pink/40"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <FilterChip label="All" emoji="✨" active={active === "all"} hex="#ffffff" onClick={() => setActive("all")} />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                label={c.label}
                emoji={c.emoji}
                hex={c.hex}
                active={active === c.id}
                onClick={() => setActive(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- grid */}
      <main className="px-4 py-10 max-w-6xl mx-auto" style={{ perspective: 1400 }}>
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((game, i) => (
            <motion.div
              key={game.id}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4), type: "spring", stiffness: 200, damping: 24 }}
            >
              <GameCard game={game} />
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-white/40 py-20">No games match that. Try another search. 🤷</p>
        )}
      </main>

      <footer className="px-4 py-10 text-center border-t border-white/5">
        <p className="text-white/40 text-sm max-w-md mx-auto">
          🥂 <span className="text-white/60 font-semibold">Drink responsibly.</span> These games are for
          adults of legal drinking age. Never drink and drive. Know your limits — water is your friend.
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/30">
          <Heart size={13} className="text-neon-pink" /> built for good nights
        </p>
      </footer>
    </div>
  );
}

function FilterChip({
  label,
  emoji,
  hex,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  hex: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
        active ? "text-ink" : "text-white/70 glass hover:text-white",
      )}
      style={active ? { background: hex, boxShadow: `0 0 24px -6px ${hex}` } : undefined}
    >
      <span className="mr-1">{emoji}</span>
      {label}
    </motion.button>
  );
}
