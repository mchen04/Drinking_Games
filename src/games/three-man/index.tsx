"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useState } from "react";
import { useTimeouts } from "@/lib/timers";
import { Crown } from "lucide-react";
import { Die, NeonButton, RequirePlayers, PlayerChip } from "@/components/ui";
import type { Player } from "@/store/players";
import { randInt } from "@/lib/random";
import { sfx } from "@/lib/sound";

export default function ThreeManGame() {
  return (
    <RequirePlayers min={3} accent="#b6ff3c">
      {(players) => <ThreeMan players={players} />}
    </RequirePlayers>
  );
}

function ThreeMan({ players }: { players: Player[] }) {
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [threeMan, setThreeMan] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [rolled, setRolled] = useState(false);
  const [mustReroll, setMustReroll] = useState(false);

  const { after } = useTimeouts();

  const roller = players[turn % players.length];
  const right = players[(turn + 1) % players.length];
  const left = players[(turn - 1 + players.length) % players.length];
  const threeManPlayer = players.find((p) => p.id === threeMan) ?? null;

  function roll() {
    if (rolling) return;
    setRolling(true);
    setRolled(true);
    sfx.click();
    const a = randInt(1, 6);
    const b = randInt(1, 6);
    setDice([a, b]);

    after(650, () => {
      setRolling(false);
      sfx.ding();
      const out: string[] = [];
      const sum = a + b;
      const threes = (a === 3 ? 1 : 0) + (b === 3 ? 1 : 0);

      if (threes > 0) {
        if (!threeMan) {
          setThreeMan(roller.id);
          out.push(`👑 ${roller.name} is the new Three Man!`);
        } else {
          out.push(`🎲 A 3! The Three Man (${threeManPlayer?.name}) drinks ${threes > 1 ? "twice" : "once"}.`);
        }
      }
      if (a === b) out.push(`Doubles! Hand out ${a} drinks however you like — then you MUST roll again.`);
      if (sum === 7) out.push(`Seven — ${right.name} (to the right) drinks.`);
      if (sum === 11) out.push(`Eleven — ${left.name} (to the left) drinks.`);
      if (out.length === 0) out.push("Safe. Pass the dice along.");
      setMsgs(out);
      setMustReroll(a === b); // doubles force the same player to roll again
    });
  }

  function nextPlayer() {
    if (mustReroll) return; // can't pass the dice until the doubles re-roll is done
    setTurn((t) => t + 1);
    setMsgs([]);
    setRolled(false);
  }

  // Presentation-only: derive a punchy headline from the settled roll.
  const sum = dice[0] + dice[1];
  const isDoubles = dice[0] === dice[1];
  const hasThree = !rolling && rolled && (dice[0] === 3 || dice[1] === 3);
  const headline = rolling || !rolled || msgs.length === 0
    ? null
    : hasThree && threeMan === roller.id
      ? { text: "THREE MAN!", color: "#b6ff3c" }
      : hasThree
        ? { text: "A THREE!", color: "#b6ff3c" }
        : isDoubles
          ? { text: "DOUBLES!", color: "#ffb627" }
          : sum === 7
            ? { text: "SEVEN", color: "#2de2c0" }
            : sum === 11
              ? { text: "ELEVEN", color: "#ff6ad5" }
              : null;

  return (
    <div className="flex flex-col items-center">
      <p className="text-white/50 text-xs sm:text-sm text-center mb-3 max-w-md px-2">
        Roll two dice. 7 = right drinks · 11 = left · any 3 = Three Man drinks · doubles = give drinks.
      </p>

      <motion.div layout className="flex flex-wrap justify-center gap-1.5 mb-3">
        {players.map((p, i) => (
          <PlayerChip key={p.id} player={p} active={i === turn % players.length} />
        ))}
      </motion.div>

      <AnimatePresence>
        {threeManPlayer && (
          <motion.div
            key={threeManPlayer.id}
            layout
            initial={{ opacity: 0, scale: 0.6, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="flex items-center gap-2 mb-3 px-3 py-1.5 glass rounded-full text-sm"
            style={{ color: threeManPlayer.color, boxShadow: `0 0 22px -6px ${threeManPlayer.color}` }}
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.6 }}
              className="inline-flex"
            >
              <Crown size={14} />
            </motion.span>
            Three Man: <b>{threeManPlayer.name}</b>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-white/60 text-sm mb-2">
        <AnimatePresence mode="wait">
          <motion.b
            key={roller.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="inline-block"
            style={{ color: roller.color }}
          >
            {roller.name}
          </motion.b>
        </AnimatePresence>
        &apos;s roll
      </p>

      {/* Dice + overlaid headline reveal */}
      <div className="relative flex gap-3 sm:gap-4 mb-3">
        <motion.div
          animate={
            !rolling && rolled && (hasThree || isDoubles)
              ? { x: [0, -8, 8, -5, 5, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex gap-3 sm:gap-4 scale-90 sm:scale-100 origin-top"
        >
          <Die value={dice[0]} rolling={rolling} size="lg" color="#b6ff3c" />
          <Die value={dice[1]} rolling={rolling} size="lg" color="#2de2c0" />
        </motion.div>

        <AnimatePresence>
          {headline && (
            <motion.div
              key={headline.text + msgs.join()}
              initial={{ opacity: 0, scale: 0.4, rotate: -6, y: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 320, damping: 13 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full font-display uppercase tracking-wider text-lg sm:text-xl whitespace-nowrap neon-text"
              style={{ color: headline.color }}
            >
              {headline.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative w-full max-w-md mb-3 min-h-[3.5rem]">
        <AnimatePresence mode="wait">
          {msgs.length > 0 && (
            <motion.div
              key={msgs.join()}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="glass-strong rounded-2xl p-3 sm:p-4 space-y-1 text-center"
            >
              {msgs.map((m, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i + 0.05, ease: EASE_OUT }}
                  className="text-sm sm:text-base text-white/85"
                >
                  {m}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <NeonButton onClick={roll} size="lg" variant="success" disabled={rolling}>
          {mustReroll ? "Roll again (doubles!)" : rolled ? "Re-roll" : "Roll dice"}
        </NeonButton>
        <NeonButton onClick={nextPlayer} size="lg" variant="ghost" disabled={!rolled || rolling || mustReroll}>
          Next player →
        </NeonButton>
      </div>
    </div>
  );
}
