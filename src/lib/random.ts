/** Client-side randomness helpers. Safe to use in components (runtime UI). */

export function randInt(minInclusive: number, maxInclusive: number) {
  return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a stateful, non-repeating picker over `items`. Cycles through a
 * shuffled copy, reshuffling once exhausted so prompts don't repeat until the
 * whole pool has been seen. Great for prompt decks.
 */
export function createDealer<T>(items: readonly T[]) {
  let pool: T[] = shuffle(items);
  let idx = 0;
  return {
    next(): T {
      if (idx >= pool.length) {
        pool = shuffle(items);
        idx = 0;
      }
      return pool[idx++];
    },
    remaining() {
      return pool.length - idx;
    },
  };
}
