export type Category =
  | "party"
  | "cards"
  | "dice"
  | "chance"
  | "timer"
  | "verbal"
  | "skill"
  | "trivia";

export type Difficulty = "Chill" | "Wild" | "Chaos";

export interface GameMeta {
  /** url slug & folder name under src/games */
  id: string;
  title: string;
  /** one punchy line shown on the card */
  tagline: string;
  category: Category;
  /** e.g. "2+", "1", "3-10" */
  players: string;
  /** physical things you need IRL, if any */
  needs?: string[];
  difficulty: Difficulty;
  /** big emoji used as the card art / icon */
  emoji: string;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  /** tailwind color token name, e.g. "neon-pink" */
  color: string;
  /** raw hex for canvas / inline styles */
  hex: string;
  emoji: string;
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "party", label: "Party", color: "neon-pink", hex: "#ff2d95", emoji: "🎉", blurb: "No gear. Just chaos." },
  { id: "cards", label: "Cards", color: "neon-cyan", hex: "#18e7ff", emoji: "🃏", blurb: "Grab a deck." },
  { id: "dice", label: "Dice", color: "neon-lime", hex: "#b6ff3c", emoji: "🎲", blurb: "Roll your fate." },
  { id: "chance", label: "Chance", color: "neon-amber", hex: "#ffb627", emoji: "🎡", blurb: "Pure luck." },
  { id: "timer", label: "Endurance", color: "neon-violet", hex: "#9d4edd", emoji: "⏱️", blurb: "Beat the clock." },
  { id: "verbal", label: "Verbal", color: "neon-coral", hex: "#ff5e5b", emoji: "🗣️", blurb: "Think fast, drink slow." },
  { id: "skill", label: "Skill", color: "neon-teal", hex: "#2de2c0", emoji: "🎯", blurb: "Aim, flip, score." },
  { id: "trivia", label: "Trivia", color: "neon-indigo", hex: "#6c5ce7", emoji: "🧠", blurb: "Know it or owe it." },
];

export function categoryMeta(id: Category): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
