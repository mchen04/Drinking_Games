"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Wheel, RequirePlayers, GameHeading, DrinkCallout, type WheelSegment } from "@/components/ui";
import type { Player } from "@/store/players";
import { drinkRain } from "@/lib/confetti";

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
    <div className="flex flex-col items-center">
      <GameHeading
        title="Shot Roulette"
        subtitle="Spin the wheel. Whoever it lands on takes the shot."
        accent="#ffb627"
      />

      <Wheel
        segments={segments}
        onSpinStart={() => setLoser(null)}
        onResult={(index) => {
          setLoser(players[index]);
          drinkRain();
        }}
      />

      <div className="h-16 mt-6 flex items-center">
        <AnimatePresence mode="wait">
          {loser && (
            <motion.div
              key={loser.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <DrinkCallout text={`${loser.name}, drink!`} accent={loser.color} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
