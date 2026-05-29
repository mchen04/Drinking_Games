"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Wheel, RequirePlayers, DrinkCallout, type WheelSegment } from "@/components/ui";
import type { Player } from "@/store/players";
import { drinkRain } from "@/lib/confetti";
import { sfx } from "@/lib/sound";

export default function ShotRoulette() {
  return (
    <RequirePlayers min={2} accent="#ffb627">
      {(players) => <Roulette players={players} />}
    </RequirePlayers>
  );
}

function Roulette({ players }: { players: Player[] }) {
  const [loser, setLoser] = useState<Player | null>(null);

  const segments: WheelSegment[] = players.map((p) => ({ label: p.name, color: p.color }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center"
    >
      <p className="text-white/50 text-sm text-center mb-3">
        Spin the wheel. Whoever it lands on takes the shot.
      </p>

      <Wheel
        size={256}
        segments={segments}
        onSpinStart={() => setLoser(null)}
        onResult={(index) => {
          setLoser(players[index]);
          drinkRain();
          sfx.pour();
        }}
      />

      {/* transient win callout — only occupies space once a result lands */}
      <AnimatePresence mode="wait">
        {loser && (
          <motion.div
            key={loser.id}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-3 flex flex-col items-center"
          >
            <DrinkCallout text={`${loser.name}, drink!`} accent={loser.color} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
