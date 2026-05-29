"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useMemo, useState } from "react";
import { useTimeouts } from "@/lib/timers";
import { RotateCcw } from "lucide-react";
import { createDeck, type Card, type Rank } from "@/lib/deck";
import { PlayingCard, NeonButton } from "@/components/ui";
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
  const drawnCount = 52 - deck.length;

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* compact status */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="glass rounded-full px-3 py-1 text-white/60">
          <motion.span
            key={drawnCount}
            initial={{ scale: 1.4, color: "#18e7ff" }}
            animate={{ scale: 1, color: "rgba(255,255,255,0.85)" }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="inline-block font-semibold tabular-nums"
          >
            {drawnCount}
          </motion.span>
          <span className="text-white/40">/52 drawn</span>
        </span>
        <span className="glass rounded-full px-3 py-1 text-white/60">
          <motion.span
            key={kings}
            initial={{ scale: 1.5, color: "#ffb627" }}
            animate={{ scale: 1, color: "rgba(255,255,255,0.85)" }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="inline-block font-semibold tabular-nums"
          >
            {kings}
          </motion.span>
          <span className="text-white/40">/4 👑</span>
        </span>
      </div>

      <div className="flex flex-row items-center justify-center gap-5 sm:gap-8 mb-4">
        {/* drawn card */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="flex items-center origin-bottom scale-[0.72] sm:scale-100"
            animate={over ? { y: [0, -10, 0], rotate: [0, -2, 2, 0] } : drawn?.rank === "K" ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: over ? 0.6 : 0.4 }}
          >
            <PlayingCard card={drawn} faceDown={!drawn} size="lg" glow={drawn?.rank === "K" ? "#ffb627" : "#18e7ff"} />
          </motion.div>
          <NeonButton onClick={draw} size="md" disabled={over || deck.length === 0}>
            {deck.length === 0 ? "Deck empty" : drawn ? "Draw next" : "Draw a card"}
          </NeonButton>
        </div>

        {/* king's cup */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-b-3xl rounded-t-lg border-2 border-white/20 overflow-hidden glass">
            <motion.div
              className="absolute bottom-0 left-0 right-0 overflow-hidden"
              style={{ background: "linear-gradient(180deg,#ffb627,#ff5e5b)" }}
              animate={{ height: `${fill}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              {/* shimmering liquid surface */}
              {fill > 0 && (
                <motion.span
                  className="absolute top-0 left-[-30%] right-[-30%] h-3"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)" }}
                  animate={{ x: ["0%", "30%", "0%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
            {/* rising bubbles while filling */}
            <AnimatePresence>
              {fill > 0 && fill < 100 && (
                <motion.span
                  key={kings}
                  className="absolute left-1/2 bottom-1 w-1.5 h-1.5 rounded-full bg-white/60"
                  initial={{ y: 0, opacity: 0.8, scale: 0.6 }}
                  animate={{ y: -36, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            <motion.span
              className="absolute inset-0 flex items-center justify-center text-3xl"
              animate={drawn?.rank === "K" ? { scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              👑
            </motion.span>
          </div>
          <span className="text-xs text-white/40">the cup</span>
        </div>
      </div>

      {/* rule reveal */}
      <div className="relative min-h-[7rem] w-full max-w-md">
        <AnimatePresence mode="wait">
          {over ? (
            <motion.div
              key="over"
              initial={{ opacity: 0, scale: 0.8, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
              className="glass-strong rounded-3xl p-4 text-center"
              style={{ boxShadow: "0 0 50px -10px #ff5e5b" }}
            >
              <motion.div
                className="text-4xl mb-1"
                animate={{ scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                👑🍺
              </motion.div>
              <h3 className="font-display text-2xl text-neon-amber neon-text mb-0.5">4th King!</h3>
              <p className="text-white/70 text-sm leading-snug">Whoever drew it chugs the entire King&apos;s Cup. Game over!</p>
            </motion.div>
          ) : rule ? (
            <motion.div
              key={drawn?.id}
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="glass-strong rounded-3xl p-4 text-center"
              style={{ boxShadow: `0 0 40px -14px ${drawn?.rank === "K" ? "#ffb627" : "#18e7ff"}` }}
            >
              <motion.div
                className="text-4xl mb-1"
                initial={{ scale: 0.4, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 16, delay: 0.05 }}
              >
                {rule.emoji}
              </motion.div>
              <h3 className={`font-display text-xl mb-1 ${drawn?.rank === "K" ? "text-neon-amber" : "text-neon-cyan"}`}>{rule.title}</h3>
              <p className="text-white/70 text-sm leading-snug">{rule.desc}</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/40 text-sm pt-6"
            >
              Draw a card to reveal its rule. Survive all four kings.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button onClick={reset} className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors">
        <RotateCcw size={13} /> reshuffle deck
      </button>
    </motion.div>
  );
}
