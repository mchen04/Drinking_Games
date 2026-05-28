import { shuffle } from "./random";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  /** numeric value, Ace high (A=14) by default */
  value: number;
  /** unique id for React keys */
  id: string;
}

export const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
export const RANKS: Rank[] = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

const RANK_VALUE: Record<Rank, number> = {
  A: 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13,
};

export function isRed(suit: Suit) {
  return suit === "♥" || suit === "♦";
}

/** Full 52-card deck (optionally shuffled). */
export function createDeck(shuffled = true): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUE[rank], id: `${rank}${suit}` });
    }
  }
  return shuffled ? shuffle(deck) : deck;
}

/** Human label e.g. "Queen of Hearts". */
export function cardName(card: Card): string {
  const ranks: Record<Rank, string> = {
    A: "Ace", J: "Jack", Q: "Queen", K: "King",
    "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six",
    "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten",
  };
  const suits: Record<Suit, string> = {
    "♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs",
  };
  return `${ranks[card.rank]} of ${suits[card.suit]}`;
}
