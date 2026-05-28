import type { GameMeta } from "@/lib/types";

/**
 * The master catalogue. Every game has a folder at `src/games/<id>/index.tsx`
 * exporting a default client component, and a matching loader in `loaders.ts`.
 */
export const GAMES: GameMeta[] = [
  // ---------------------------------------------------------------- party
  { id: "never-have-i-ever", title: "Never Have I Ever", tagline: "Confess your sins, one finger at a time.", category: "party", players: "2+", needs: ["Drinks"], difficulty: "Wild", emoji: "🙈" },
  { id: "most-likely-to", title: "Most Likely To", tagline: "Point fingers. Assign blame. Drink.", category: "party", players: "3+", needs: ["Drinks"], difficulty: "Wild", emoji: "👉" },
  { id: "would-you-rather", title: "Would You Rather", tagline: "Impossible choices, real consequences.", category: "party", players: "2+", needs: ["Drinks"], difficulty: "Chill", emoji: "🤔" },
  { id: "truth-or-dare", title: "Truth or Dare", tagline: "Spill it or do it. No backing out.", category: "party", players: "2+", needs: ["Drinks"], difficulty: "Chaos", emoji: "🎭" },
  { id: "paranoia", title: "Paranoia", tagline: "Whisper a question. Reveal it… maybe.", category: "party", players: "4+", needs: ["Drinks"], difficulty: "Wild", emoji: "👀" },
  { id: "two-truths", title: "Two Truths & a Lie", tagline: "Lie convincingly. Catch the liars.", category: "party", players: "3+", needs: ["Drinks"], difficulty: "Chill", emoji: "🕵️" },
  { id: "do-or-drink", title: "Do or Drink", tagline: "Take the dare or take the shot.", category: "party", players: "2+", needs: ["Drinks"], difficulty: "Chaos", emoji: "💀" },

  // ---------------------------------------------------------------- cards
  { id: "kings-cup", title: "Kings Cup", tagline: "The whole deck. The whole chaos.", category: "cards", players: "3+", needs: ["Deck of cards", "A cup"], difficulty: "Chaos", emoji: "👑" },
  { id: "ride-the-bus", title: "Ride the Bus", tagline: "Guess right or ride the bus alone.", category: "cards", players: "1+", needs: ["Deck of cards"], difficulty: "Wild", emoji: "🚌" },
  { id: "pyramid", title: "Pyramid", tagline: "Build it up, call the bluffs.", category: "cards", players: "2+", needs: ["Deck of cards"], difficulty: "Wild", emoji: "🔺" },
  { id: "higher-or-lower", title: "Higher or Lower", tagline: "One card. Higher or lower?", category: "cards", players: "1+", needs: ["Deck of cards"], difficulty: "Chill", emoji: "📈" },
  { id: "red-or-black", title: "Red or Black", tagline: "Fifty-fifty. Loser drinks.", category: "cards", players: "1+", needs: ["Deck of cards"], difficulty: "Chill", emoji: "🃏" },
  { id: "bus-driver", title: "Bus Driver", tagline: "Survive the streak to win.", category: "cards", players: "1+", needs: ["Deck of cards"], difficulty: "Wild", emoji: "🎰" },
  { id: "president", title: "President & Scum", tagline: "Climb from scumbag to president.", category: "cards", players: "3+", needs: ["Deck of cards"], difficulty: "Wild", emoji: "🎩" },

  // ---------------------------------------------------------------- dice
  { id: "three-man", title: "Three Man", tagline: "Roll, assign, and dodge the Three Man.", category: "dice", players: "3+", needs: ["2 dice", "Drinks"], difficulty: "Wild", emoji: "🎲" },
  { id: "mexico", title: "Mexico", tagline: "Bluff your roll. Lowest drinks.", category: "dice", players: "2+", needs: ["2 dice", "Drinks"], difficulty: "Wild", emoji: "🌮" },
  { id: "ship-captain-crew", title: "Ship, Captain, Crew", tagline: "Land the 6-5-4, score your cargo.", category: "dice", players: "2+", needs: ["5 dice", "Drinks"], difficulty: "Chill", emoji: "⚓" },

  // ---------------------------------------------------------------- chance
  { id: "spin-the-bottle", title: "Spin the Bottle", tagline: "Round and round. Where it stops…", category: "chance", players: "3+", needs: ["Drinks"], difficulty: "Wild", emoji: "🍾" },
  { id: "shot-roulette", title: "Shot Roulette", tagline: "Spin the wheel. Someone's drinking.", category: "chance", players: "2+", needs: ["Shots"], difficulty: "Chaos", emoji: "🎡" },
  { id: "wheel-of-misfortune", title: "Wheel of Misfortune", tagline: "Spin for a dare you'll regret.", category: "chance", players: "2+", needs: ["Drinks"], difficulty: "Chaos", emoji: "☸️" },
  { id: "russian-roulette", title: "Russian Roulette", tagline: "Six glasses. One's a killer. Choose.", category: "chance", players: "2+", needs: ["Shots"], difficulty: "Chaos", emoji: "🔫" },

  // ---------------------------------------------------------------- timer
  { id: "power-hour", title: "Power Hour", tagline: "Sixty sips. Sixty minutes. Go.", category: "timer", players: "1+", needs: ["Beer"], difficulty: "Wild", emoji: "⏱️" },
  { id: "centurion", title: "Centurion", tagline: "100 shots. 100 minutes. Legend status.", category: "timer", players: "1+", needs: ["Beer"], difficulty: "Chaos", emoji: "💯" },
  { id: "beer-blitz", title: "Beer Blitz", tagline: "Tap fast before the glass overflows.", category: "timer", players: "1+", needs: ["Drinks"], difficulty: "Wild", emoji: "⚡" },

  // ---------------------------------------------------------------- verbal
  { id: "categories", title: "Categories", tagline: "Name it fast or drink. No repeats.", category: "verbal", players: "3+", needs: ["Drinks"], difficulty: "Chill", emoji: "🧩" },
  { id: "buzz", title: "Buzz", tagline: "Count up. Replace 7s with BUZZ.", category: "verbal", players: "3+", needs: ["Drinks"], difficulty: "Chill", emoji: "🐝" },
  { id: "fingers", title: "Fingers", tagline: "Guess the count. Last one drinks.", category: "verbal", players: "3+", needs: ["A cup", "Drinks"], difficulty: "Wild", emoji: "✋" },
  { id: "thumper", title: "Thumper", tagline: "Keep the rhythm. Pass the motion.", category: "verbal", players: "3+", needs: ["Drinks"], difficulty: "Chaos", emoji: "🥁" },
  { id: "medusa", title: "Medusa", tagline: "Heads down, heads up. Eyes locked = drink.", category: "verbal", players: "3+", needs: ["Shots"], difficulty: "Wild", emoji: "🐍" },
  { id: "name-game", title: "The Name Game", tagline: "Last letter starts the next name.", category: "verbal", players: "2+", needs: ["Drinks"], difficulty: "Chill", emoji: "🌟" },
  { id: "word-chain", title: "Word Association", tagline: "Riff fast. Hesitate and drink.", category: "verbal", players: "2+", needs: ["Drinks"], difficulty: "Chill", emoji: "🔗" },

  // ---------------------------------------------------------------- skill
  { id: "beer-pong", title: "Beer Pong", tagline: "Sink cups. Track the carnage.", category: "skill", players: "2+", needs: ["Cups", "Ping-pong balls"], difficulty: "Wild", emoji: "🏓" },
  { id: "flip-cup", title: "Flip Cup", tagline: "Chug, flip, win. Team relay.", category: "skill", players: "4+", needs: ["Cups", "Drinks"], difficulty: "Wild", emoji: "🥤" },
  { id: "quarters", title: "Quarters", tagline: "Bounce it in. Assign drinks.", category: "skill", players: "2+", needs: ["A quarter", "A cup"], difficulty: "Chill", emoji: "🪙" },
  { id: "drunk-jenga", title: "Drunk Jenga", tagline: "Pull a block, do the dare.", category: "skill", players: "2+", needs: ["Jenga (optional)"], difficulty: "Wild", emoji: "🧱" },

  // ---------------------------------------------------------------- trivia
  { id: "drunk-trivia", title: "Drunk Trivia", tagline: "Wrong answer? Bottoms up.", category: "trivia", players: "1+", needs: ["Drinks"], difficulty: "Chill", emoji: "🧠" },
];

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}
