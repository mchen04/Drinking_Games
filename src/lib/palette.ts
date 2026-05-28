/**
 * Single source of truth for the neon palette. Category accents mirror
 * CATEGORIES in types.ts; semantic colors are the shared win/lose/neutral hues
 * used across games for glows and callouts.
 */
export const ACCENT = {
  party: "#ff2d95",
  cards: "#18e7ff",
  dice: "#b6ff3c",
  chance: "#ffb627",
  timer: "#9d4edd",
  verbal: "#ff5e5b",
  skill: "#2de2c0",
  trivia: "#6c5ce7",
} as const;

export const SEMANTIC = {
  win: "#b6ff3c",
  lose: "#ff5e5b",
  warn: "#ffb627",
  neutral: "#9d4edd",
} as const;
