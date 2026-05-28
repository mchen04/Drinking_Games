import type { ComponentType } from "react";

type Loader = () => Promise<{ default: ComponentType }>;

/**
 * Explicit slug → dynamic-import map. Keeping it explicit (rather than a
 * templated import) lets the bundler code-split every game into its own chunk
 * and keeps the dashboard payload tiny.
 */
export const loaders: Record<string, Loader> = {
  // party
  "never-have-i-ever": () => import("./never-have-i-ever"),
  "most-likely-to": () => import("./most-likely-to"),
  "would-you-rather": () => import("./would-you-rather"),
  "truth-or-dare": () => import("./truth-or-dare"),
  paranoia: () => import("./paranoia"),
  "two-truths": () => import("./two-truths"),
  "do-or-drink": () => import("./do-or-drink"),
  // cards
  "kings-cup": () => import("./kings-cup"),
  "ride-the-bus": () => import("./ride-the-bus"),
  pyramid: () => import("./pyramid"),
  "higher-or-lower": () => import("./higher-or-lower"),
  "red-or-black": () => import("./red-or-black"),
  "bus-driver": () => import("./bus-driver"),
  president: () => import("./president"),
  // dice
  "three-man": () => import("./three-man"),
  mexico: () => import("./mexico"),
  "ship-captain-crew": () => import("./ship-captain-crew"),
  // chance
  "spin-the-bottle": () => import("./spin-the-bottle"),
  "shot-roulette": () => import("./shot-roulette"),
  "wheel-of-misfortune": () => import("./wheel-of-misfortune"),
  "russian-roulette": () => import("./russian-roulette"),
  // timer
  "power-hour": () => import("./power-hour"),
  centurion: () => import("./centurion"),
  "beer-blitz": () => import("./beer-blitz"),
  // verbal
  categories: () => import("./categories"),
  buzz: () => import("./buzz"),
  fingers: () => import("./fingers"),
  thumper: () => import("./thumper"),
  medusa: () => import("./medusa"),
  "name-game": () => import("./name-game"),
  "word-chain": () => import("./word-chain"),
  // skill
  "beer-pong": () => import("./beer-pong"),
  "flip-cup": () => import("./flip-cup"),
  quarters: () => import("./quarters"),
  "drunk-jenga": () => import("./drunk-jenga"),
  // trivia
  "drunk-trivia": () => import("./drunk-trivia"),
};
