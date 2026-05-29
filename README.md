# 🍸 Pour Decisions

**The ultimate neon-noir drinking games arcade.** 36 beautifully animated drinking
games in one dashboard — cards, dice, party prompts, spinners, endurance challenges,
verbal duels, skill games and trivia. Pick your poison and play.

> 🥂 **Drink responsibly.** For adults of legal drinking age only. Never drink and
> drive. Every game works perfectly "dry" too — swap sips for any forfeit you like.

---

## ✨ Highlights

- **36 games across 8 categories** — single-player, pass-and-play multiplayer, card,
  dice, wheel, timer, verbal and trivia.
- **State-of-the-art animations** — Framer Motion throughout: 3D card flips, a
  physics-eased prize wheel, tumbling dice, pointer-tracked card tilt, confetti and a
  living neon background.
- **Zero-asset sound** — clicks, dings, buzzes and "pour" sweeps are synthesised on
  the fly with the Web Audio API (mute toggle included). No audio files shipped.
- **One cohesive theme** — a deep nightclub palette with glassmorphism, animated
  gradient blobs and rising bubbles. Every category has its own neon accent.
- **Shared roster** — add your squad once; every multiplayer game remembers them.
- **Fully responsive** — designed mobile-first for passing one phone around the table.

---

## 🎮 The Catalogue

### 🎉 Party (no gear, just chaos)
| Game | What it is |
|---|---|
| Never Have I Ever | Confess your sins — mild / spicy / extra decks. |
| Most Likely To | Point on three; the winner drinks. |
| Would You Rather | Impossible dilemmas; the minority drinks. |
| Truth or Dare | Spill it or do it. |
| Paranoia | Whisper a question, flip a coin to reveal it. |
| Two Truths & a Lie | Lie convincingly; liar or group drinks. |
| Do or Drink | Take the dare or take the shot. |

### 🃏 Cards (grab a deck)
| Game | What it is |
|---|---|
| Kings Cup | The whole deck, every rule, the filling King's Cup. |
| Ride the Bus | The 4-question guessing gauntlet. |
| Pyramid | Flip the pyramid, assign drinks, bluff freely. |
| Higher or Lower | One card — higher or lower? Streak counter. |
| Red or Black | Fifty-fifty; loser drinks. |
| Bus Driver | Survive a run with no face cards. |
| President & Scum | Round manager + role hierarchy. |

### 🎲 Dice (roll your fate)
| Game | What it is |
|---|---|
| Three Man | 7s, 11s, doubles and the dreaded Three Man. |
| Mexico | Bluff your roll; lowest drinks. |
| Ship, Captain, Crew | Land 6-5-4, score your cargo. |

### 🎡 Chance (pure luck)
| Game | What it is |
|---|---|
| Spin the Bottle | A spinning bottle in a circle of players. |
| Shot Roulette | Spin the wheel of liquid fate. |
| Wheel of Misfortune | Spin for a punishment. |
| Russian Roulette | Six glasses, one's loaded. |

### ⏱️ Endurance (beat the clock)
| Game | What it is |
|---|---|
| Power Hour | 60 sips in 60 minutes. |
| Centurion | 100 shots in 100 minutes. |
| Beer Blitz | Reflex pour-timing arcade game. |

### 🗣️ Verbal (think fast, drink slow)
| Game | What it is |
|---|---|
| Categories | Name it fast or drink. |
| Buzz | Count up, replace 7s with BUZZ. |
| Fingers | Secret pass-and-play guessing. |
| Thumper | Stay on the rhythm. |
| Medusa | Heads down, heads up — lock eyes, drink. |
| The Name Game | Last letter starts the next name. |
| Word Association | Riff fast or drink. |

### 🎯 Skill (aim, flip, score)
| Game | What it is |
|---|---|
| Beer Pong | Cup-rack scoreboard. |
| Flip Cup | Two-team relay race. |
| Quarters | Bounce-the-coin arcade mini-game. |
| Drunk Jenga | Pull a block, do the dare. |

### 🧠 Trivia
| Game | What it is |
|---|---|
| Drunk Trivia | Wrong answer? Bottoms up. |

---

## 🛠️ Tech Stack

- **[Next.js 15](https://nextjs.org/)** (App Router) + **React 19** + **TypeScript** (strict)
- **[Tailwind CSS v4](https://tailwindcss.com/)** for styling + design tokens
- **[Framer Motion](https://www.framer.com/motion/)** for animation
- **[Zustand](https://github.com/pmndrs/zustand)** (persisted) for the shared player roster
- **canvas-confetti**, **lucide-react**, and a tiny custom Web Audio sound engine

Each game is code-split into its own chunk and lazy-loaded on demand, so the dashboard
stays light.

---

## 🚀 Getting Started

```bash
pnpm install      # install dependencies
pnpm dev          # start the dev server → http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit
```

> Requires Node 20+. Uses pnpm (npm/yarn also fine).

---

## 🧱 Architecture

```
src/
├─ app/
│  ├─ page.tsx              # dashboard route
│  ├─ game/[slug]/page.tsx  # dynamic game route (static-generated per game)
│  ├─ layout.tsx            # fonts + metadata
│  ├─ globals.css           # theme tokens, animations, glass utilities
│  ├─ not-found.tsx         # themed 404
│  └─ icon.svg              # favicon
├─ components/
│  ├─ Dashboard.tsx         # hero, search, category filter, game grid
│  ├─ GameCard.tsx          # 3D-tilt game tile
│  ├─ GameClient.tsx        # lazy-loads a game into the shell
│  ├─ GameShell.tsx         # chrome around every game (back nav, header, bg)
│  ├─ NeonBackground.tsx    # animated blobs + rising bubbles
│  └─ ui/                   # shared building blocks (see below)
├─ games/
│  ├─ registry.ts           # the master catalogue (GameMeta[])
│  ├─ loaders.ts            # slug → dynamic import map
│  └─ <game-id>/index.tsx   # one self-contained component per game
├─ lib/                     # deck, random, sound, confetti, cn, types
└─ store/players.ts         # persisted shared roster
```

### Shared UI kit (`src/components/ui`)

`NeonButton`, `GlassCard`, `PromptDeck`, `PlayingCard`, `Die`, `Wheel`,
`RequirePlayers` / `PlayerSetup`, plus primitives (`Chip`, `GameHeading`,
`DrinkCallout`, `PlayerChip`).

### Adding a new game

1. Add a `GameMeta` entry to `src/games/registry.ts`.
2. Add a loader line to `src/games/loaders.ts`.
3. Create `src/games/<id>/index.tsx` — a `"use client"` component with a default
   export and no props. Use the shared UI kit and `lib/` helpers; the `GameShell`
   provides the header, back button and background automatically.

That's it — it appears on the dashboard, filterable and searchable.

---

## ✅ Quality & Verification

This codebase was hardened with an aggressive **criticality loop** — 31 fresh-context
audit cycles (thermo-nuclear + deslop) that found and fixed **100+ genuine issues**
before converging: a critical inverted Beer Pong win condition, ~35 timer/RAF/interval
cleanup and stale-closure bugs (wrong-player-penalized, overrunning timers, double-start
races, setState-after-unmount), real rule corrections (Higher-or-Lower ties, Three Man
doubles re-roll, Ship-Captain-Crew scoring & labels, Mexico doubles), dead-code removal,
and canonical consolidation (`useTimeouts`, `CircleProgress`, shared palette). The full
trajectory is recorded in [`criticality-loop.log.md`](./criticality-loop.log.md).

Every change kept `pnpm typecheck` + `pnpm build` green (41/41 routes prerender). All
**36 games were then verified end-to-end in a headless browser** (agent-browser):
the dashboard plus a deep interaction pass over all 8 categories, and a render smoke-test
of the rest — **zero uncaught console errors** across the suite.

## ☁️ Deployment

Optimised for **[Vercel](https://vercel.com/)** (zero-config Next.js):

```bash
vercel        # preview deploy
vercel --prod # production deploy
```

Or connect the GitHub repo to Vercel for automatic deploys on push.

---

## 📜 License & Disclaimer

Built for good nights. Please enjoy responsibly — know your limits, hydrate, and
look out for your friends. 🥂
