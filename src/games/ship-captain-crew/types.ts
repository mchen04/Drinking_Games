import type { Player } from "@/store/players";

// The three required values in order: 6=Ship, 5=Captain, 4=Crew
export const REQUIRED: [number, number, number] = [6, 5, 4];
export const REQUIRED_LABELS: [string, string, string] = ["Ship", "Captain", "Crew"];
export const MAX_ROLLS = 3;
export const ACCENT = "#b6ff3c";

export interface TurnResult {
  player: Player;
  cargo: number; // sum of cargo dice; -1 if never got ship+captain+crew
  locked: boolean[]; // which dice were locked
  finalDice: number[];
}
