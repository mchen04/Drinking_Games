"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useTimeouts } from "@/lib/timers";
import { Crown } from "lucide-react";
import { Die, NeonButton, RequirePlayers, GameHeading, PlayerChip } from "@/components/ui";
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

  return (
    <div className="flex flex-col items-center">
      <GameHeading title="Three Man" subtitle="Roll two dice. 7 = right drinks · 11 = left · any 3 = Three Man drinks · doubles = give drinks." accent="#b6ff3c" />

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {players.map((p, i) => (
          <PlayerChip key={p.id} player={p} active={i === turn % players.length} />
        ))}
      </div>

      {threeManPlayer && (
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 glass rounded-full text-sm" style={{ color: threeManPlayer.color }}>
          <Crown size={14} /> Three Man: <b>{threeManPlayer.name}</b>
        </div>
      )}

      <p className="text-white/60 mb-4">
        <b style={{ color: roller.color }}>{roller.name}</b>&apos;s roll
      </p>

      <div className="flex gap-4 mb-8">
        <Die value={dice[0]} rolling={rolling} size="lg" color="#b6ff3c" />
        <Die value={dice[1]} rolling={rolling} size="lg" color="#2de2c0" />
      </div>

      <div className="min-h-[6rem] w-full max-w-md mb-4">
        <AnimatePresence mode="wait">
          {msgs.length > 0 && (
            <motion.div
              key={msgs.join()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-strong rounded-2xl p-4 space-y-1.5 text-center"
            >
              {msgs.map((m, i) => (
                <p key={i} className="text-white/85">{m}</p>
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
