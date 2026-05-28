"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { loaders } from "@/games/loaders";
import type { GameMeta } from "@/lib/types";
import { GameShell } from "./GameShell";

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-white/15 border-t-neon-pink animate-spin" />
      <p className="text-white/40 text-sm font-display uppercase tracking-widest">Pouring…</p>
    </div>
  );
}

/** Loads a game's chunk on demand and renders it inside the themed shell. */
export function GameClient({ meta }: { meta: GameMeta }) {
  const Game = useMemo(
    () =>
      dynamic(loaders[meta.id], {
        ssr: false,
        loading: () => <Loader />,
      }),
    [meta.id],
  );

  return (
    <GameShell meta={meta}>
      <Game />
    </GameShell>
  );
}
