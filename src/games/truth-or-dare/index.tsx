"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { NeonButton, DrinkCallout, PlayerChip, RequirePlayers } from "@/components/ui";
import { usePlayers, type Player } from "@/store/players";
import { createDealer } from "@/lib/random";
import { useTimeouts } from "@/lib/timers";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { TRUTHS, DARES } from "./data";

const ACCENT = "#ff2d95";
const CYAN = "#18e7ff";

type Phase = "pick" | "reveal";
type PickType = "truth" | "dare";

interface Dealers {
  truth: ReturnType<typeof createDealer<string>>;
  dare: ReturnType<typeof createDealer<string>>;
}

function makeDealers(): Dealers {
  return {
    truth: createDealer(TRUTHS),
    dare: createDealer(DARES),
  };
}

// ─── Inner game board ────────────────────────────────────────────────────────

function GameBoard({ players }: { players: Player[] }) {
  const hasPlayers = players.length >= 2;

  const [phase, setPhase] = useState<Phase>("pick");
  const [pickType, setPickType] = useState<PickType>("truth");
  const [prompt, setPrompt] = useState<string>("");
  const [turnIndex, setTurnIndex] = useState(0);
  const [showDrink, setShowDrink] = useState(false);

  const dealersRef = useRef<Dealers>(makeDealers());

  const { after, clearAll } = useTimeouts();

  const currentPlayer: Player | null =
    hasPlayers ? players[turnIndex % players.length] : null;

  const pick = useCallback((type: PickType) => {
    sfx.whoosh();
    const item = (type === "truth" ? dealersRef.current.truth : dealersRef.current.dare).next();
    setPickType(type);
    setPrompt(item);
    setShowDrink(false);
    setPhase("reveal");
  }, []);

  function advance() {
    if (hasPlayers) setTurnIndex((t) => t + 1);
    setPhase("pick");
  }

  function handleDidIt() {
    sfx.win();
    pop(0.5, 0.4);
    advance();
  }

  function handleChicken() {
    sfx.buzz();
    drinkRain();
    setShowDrink(true);
    clearAll();
    after(2200, () => {
      setShowDrink(false);
      setPhase("pick");
      if (hasPlayers) setTurnIndex((t) => t + 1);
    });
  }

  function resetGame() {
    clearAll();
    sfx.click();
    dealersRef.current = makeDealers();
    setPhase("pick");
    setTurnIndex(0);
    setShowDrink(false);
    setPrompt("");
  }

  const cardGlow =
    pickType === "truth"
      ? { boxShadow: `0 0 48px -10px ${CYAN}` }
      : { boxShadow: `0 0 48px -10px ${ACCENT}` };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <p className="text-white/50 text-sm text-center mb-3">
        Pick your poison. Chicken out and take a drink.
      </p>

      {/* Player turn indicator */}
      {hasPlayers && (
        <motion.div layout className="flex flex-wrap justify-center gap-2 mb-3">
          <AnimatePresence initial={false}>
            {players.map((p, i) => (
              <motion.span
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <PlayerChip player={p} active={i === turnIndex % players.length} />
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Current player label */}
      <AnimatePresence mode="wait">
        {currentPlayer && phase === "pick" && (
          <motion.p
            key={`lbl-${currentPlayer.id}-${turnIndex}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-white/60 text-sm mb-4 text-center"
          >
            <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
            &apos;s turn — choose wisely
          </motion.p>
        )}
      </AnimatePresence>

      {/* Main interaction area */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {/* ── Pick phase ── */}
          {phase === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
              style={{ perspective: 1000 }}
            >
              {/* Truth — cyan glow wrapper since NeonButton has no style prop */}
              <motion.div
                initial={{ opacity: 0, rotateY: -90, y: 14 }}
                animate={{ opacity: 1, rotateY: 0, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.05 }}
                whileHover={{ y: -4, rotateX: 6 }}
                whileTap={{ scale: 0.96 }}
                className="flex-1 sm:flex-none sm:min-w-[160px] rounded-2xl [transform-style:preserve-3d]"
                style={{ boxShadow: `0 0 28px -8px ${CYAN}` }}
              >
                <NeonButton
                  variant="ghost"
                  size="lg"
                  onClick={() => pick("truth")}
                  className="w-full text-xl font-display tracking-widest uppercase border-2 border-[#18e7ff] text-[#18e7ff]"
                >
                  💬 Truth
                </NeonButton>
              </motion.div>

              {/* Dare */}
              <motion.div
                initial={{ opacity: 0, rotateY: 90, y: 14 }}
                animate={{ opacity: 1, rotateY: 0, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.12 }}
                whileHover={{ y: -4, rotateX: 6 }}
                whileTap={{ scale: 0.96 }}
                className="flex-1 sm:flex-none sm:min-w-[160px] [transform-style:preserve-3d]"
              >
                <NeonButton
                  variant="danger"
                  size="lg"
                  onClick={() => pick("dare")}
                  className="w-full text-xl font-display tracking-widest uppercase"
                >
                  🔥 Dare
                </NeonButton>
              </motion.div>
            </motion.div>
          )}

          {/* ── Reveal phase ── */}
          {phase === "reveal" && (
            <motion.div
              key={`reveal-${turnIndex}-${pickType}`}
              initial={{ opacity: 0, y: 28, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="w-full"
            >
              {/* Type badge — coin-flips in on reveal */}
              <div className="flex justify-center mb-3" style={{ perspective: 800 }}>
                <motion.span
                  initial={{ rotateY: -540, scale: 0.6, opacity: 0 }}
                  animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 16 }}
                  className="text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full [transform-style:preserve-3d]"
                  style={
                    pickType === "truth"
                      ? {
                          background: `${CYAN}22`,
                          color: CYAN,
                          boxShadow: `inset 0 0 0 1px ${CYAN}55`,
                        }
                      : {
                          background: `${ACCENT}22`,
                          color: ACCENT,
                          boxShadow: `inset 0 0 0 1px ${ACCENT}55`,
                        }
                  }
                >
                  {pickType === "truth" ? "💬 Truth" : "🔥 Dare"}
                </motion.span>
              </div>

              {/* Prompt glass card — shakes when the player chickens out */}
              <motion.div
                animate={showDrink ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-strong rounded-3xl p-5 sm:p-6 text-center mb-4"
                style={cardGlow}
              >
                <p className="text-white text-base sm:text-lg leading-relaxed font-medium">
                  {prompt}
                </p>
              </motion.div>

              {/* Action area — drink callout overlays the buttons (no reserved block) */}
              <div className="relative flex justify-center min-h-[3rem]">
                <AnimatePresence mode="wait">
                  {showDrink ? (
                    <motion.div
                      key="drink"
                      className="absolute inset-0 flex justify-center"
                    >
                      <DrinkCallout
                        text={
                          currentPlayer
                            ? `${currentPlayer.name}, drink up! 🍺`
                            : "Drink up! 🍺"
                        }
                        accent={ACCENT}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ delay: 0.12 }}
                      className="flex flex-col sm:flex-row gap-3 justify-center"
                    >
                      <NeonButton variant="success" size="md" onClick={handleDidIt}>
                        Did it / Answered 😎
                      </NeonButton>
                      <NeonButton variant="danger" size="md" onClick={handleChicken}>
                        Chicken — drink 🍺
                      </NeonButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      <button
        onClick={resetGame}
        className="mt-5 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        <RotateCcw size={13} /> new game
      </button>
    </div>
  );
}

// ─── Default export ──────────────────────────────────────────────────────────

export default function TruthOrDare() {
  const { players } = usePlayers();

  // With 2+ players: enforce roster and rotate turns
  if (players.length >= 2) {
    return (
      <RequirePlayers min={2} accent={ACCENT}>
        {(activePlayers) => <GameBoard players={activePlayers} />}
      </RequirePlayers>
    );
  }

  // Free-play: no roster enforced, pass empty array for no-turn-rotation mode
  return <GameBoard players={[]} />;
}
