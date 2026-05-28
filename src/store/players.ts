"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Player {
  id: string;
  name: string;
  /** accent color hex assigned on creation */
  color: string;
}

const PALETTE = [
  "#ff2d95", "#18e7ff", "#b6ff3c", "#ffb627",
  "#9d4edd", "#2de2c0", "#ff5e5b", "#6c5ce7",
  "#4d7cff", "#ff4fd8",
];

let counter = 0;
function makeId() {
  counter += 1;
  return `p_${counter}_${Math.floor(Math.random() * 1e6)}`;
}

interface PlayersState {
  players: Player[];
  add: (name: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  clear: () => void;
}

export const usePlayers = create<PlayersState>()(
  persist(
    (set, get) => ({
      players: [],
      add: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const color = PALETTE[get().players.length % PALETTE.length];
        set({ players: [...get().players, { id: makeId(), name: trimmed, color }] });
      },
      remove: (id) => set({ players: get().players.filter((p) => p.id !== id) }),
      rename: (id, name) =>
        set({ players: get().players.map((p) => (p.id === id ? { ...p, name } : p)) }),
      clear: () => set({ players: [] }),
    }),
    { name: "pd:players" },
  ),
);
