/**
 * Pure scoring helpers for Mexico.
 *
 * Ranking (higher score = better roll):
 *   Mexico (2+1)  → 1000          — always wins, never loses
 *   Doubles dd    → 900 + d        (66=966, 55=955, … 11=911)
 *   Regular       → hi*10 + lo     (e.g. [6,4]→64, [3,2]→32)
 *
 * Round loser: player(s) with the LOWEST score drink.
 */

/**
 * Compute a numeric score for ranking purposes (higher = better roll).
 */
export function scoreRoll(a: number, b: number): number {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  // Mexico: one die is 2, the other is 1
  if (hi === 2 && lo === 1) return 1000;
  // Doubles
  if (hi === lo) return 900 + hi;
  // Regular: hi is tens digit, lo is ones
  return hi * 10 + lo;
}

/**
 * Human-readable label for a roll.
 */
export function rollLabel(a: number, b: number): string {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi === 2 && lo === 1) return "Mexico!";
  if (hi === lo) return `Doubles ${hi}s`;
  return `${hi}${lo}`;
}

export interface RollResult {
  playerId: string;
  dice: [number, number];
  score: number;
  label: string;
}

/**
 * Given all roll results for a round, return the ids of the loser(s).
 * All players tied at the lowest score must drink.
 */
export function loserIds(results: RollResult[]): string[] {
  if (results.length === 0) return [];
  const minScore = Math.min(...results.map((r) => r.score));
  return results.filter((r) => r.score === minScore).map((r) => r.playerId);
}
