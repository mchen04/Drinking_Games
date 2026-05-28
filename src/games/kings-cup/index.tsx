"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw } from "lucide-react";
import { createDeck, type Card, type Rank } from "@/lib/deck";
import { PlayingCard, NeonButton, GameHeading } from "@/components/ui";
import { celebrate, drinkRain } from "@/lib/confetti";
import { sfx } from "@/lib/sound";

interface Rule {
  title: string;
  desc: string;
  emoji: string;
}

const RULES: Record<Rank, Rule> = {
  A: { title: "Waterfall", emoji: "🌊", desc: "Everyone drinks. You can't stop until the person before you does." },
  "2": { title: "You", emoji: "👉", desc: "Pick someone. They take a drink." },
  "3": { title: "Me", emoji: "😩", desc: "That's you. Take a drink." },
  "4": { title: "Floor", emoji: "⬇️", desc: "Last person to touch the floor drinks." },
  "5": { title: "Guys", emoji: "🕺", desc: "All the guys take a drink." },
  "6": { title: "Chicks", emoji: "💃", desc: "All the girls take a drink." },
  "7": { title: "Heaven", emoji: "🙌", desc: "Last person to raise a hand to the sky drinks." },
  "8": { title: "Mate", emoji: "🤝", desc: "Pick a drinking buddy. They drink whenever you do." },
  "9": { title: "Rhyme", emoji: "🎤", desc: "Say a word. Go around rhyming — first to fail drinks." },
  "10": { title: "Categories", emoji: "🗂️", desc: "Name a category. Go around — first blank drinks." },
  J: { title: "Make a Rule", emoji: "📜", desc: "Invent a rule everyone must follow. Break it = drink." },
  Q: { title: "Question Master", emoji: "❓", desc: "Anyone who answers your questions drinks, until the next Queen." },
  K: { title: "King's Cup", emoji: "👑", desc: "Pour some of your drink into the cup. The 4th King chugs it all!" },
};

export default function KingsCup() {
  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [drawn, setDrawn] = useState<Card | null>(null);
  const [kings, setKings] = useState(0);
  const [over, setOver] = useState(false);

  const { after, clearAll } = useTimeouts();
  const rule = useMemo(() => (drawn ? RULES[drawn.rank] : null), [drawn]);

  function draw() {
    if (over || deck.length === 0) return;
    sfx.flip();
    const [next, ...rest] = deck;
    setDrawn(next);
    setDeck(rest);
    if (next.rank === "K") {
      const k = kings + 1;
      setKings(k);
      if (k >= 4) {
        setOver(true);
        after(400, () => {
          celebrate();
          drinkRain();
          sfx.win();
        });
      } else {
        after(300, () => sfx.pour());
      }
    }
  }

  function reset() {
    clearAll();
    setDeck(createDeck());
    setDrawn(null);
    setKings(0);
    setOver(false);
  }

  const fill = (kings / 4) * 100;

  return (
    <div className="flex flex-col items-center">
      <GameHeading
        title="Kings Cup"
        subtitle={`${52 - deck.length}/52 drawn · ${kings}/4 kings poured`}
        accent="#18e7ff"
      />

      <div className="flex flex-col sm:flex-row items-center gap-10 mb-8">
        {/* drawn card */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-52 flex items-center">
            <PlayingCard card={drawn} faceDown={!drawn} size="lg" glow="#18e7ff" />
          </div>
          <NeonButton onClick={draw} size="lg" disabled={over || deck.length === 0}>
            {deck.length === 0 ? "Deck empty" : drawn ? "Draw next" : "Draw a card"}
          </NeonButton>
        </div>

        {/* king's cup */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-24 h-32 rounded-b-3xl rounded-t-lg border-2 border-white/20 overflow-hidden glass">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{ background: "linear-gradient(180deg,#ffb627,#ff5e5b)" }}
              animate={{ height: `${fill}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-3xl">👑</span>
          </div>
          <span className="text-xs text-white/40">the cup</span>
        </div>
      </div>

      {/* rule reveal */}
      <div className="min-h-[8rem] w-full max-w-md">
        <AnimatePresence mode="wait">
          {over ? (
            <motion.div
              key="over"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl p-6 text-center"
              style={{ boxShadow: "0 0 50px -10px #ff5e5b" }}
            >
              <div className="text-5xl mb-2">👑🍺</div>
              <h3 className="font-display text-2xl text-neon-amber neon-text mb-1">4th King!</h3>
              <p className="text-white/70">Whoever drew it chugs the entire King&apos;s Cup. Game over!</p>
            </motion.div>
          ) : rule ? (
            <motion.div
              key={drawn?.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass-strong rounded-3xl p-6 text-center"
              style={{ boxShadow: "0 0 40px -14px #18e7ff" }}
            >
              <div className="text-4xl mb-2">{rule.emoji}</div>
              <h3 className="font-display text-xl text-neon-cyan mb-2">{rule.title}</h3>
              <p className="text-white/70 leading-snug">{rule.desc}</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/40 pt-8"
            >
              Draw a card to reveal its rule. Survive all four kings.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button onClick={reset} className="mt-8 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors">
        <RotateCcw size={13} /> reshuffle deck
      </button>
    </div>
  );
}
