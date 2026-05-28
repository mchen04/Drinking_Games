"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { NeonButton, GameHeading, DrinkCallout, PlayerChip, RequirePlayers } from "@/components/ui";
import { usePlayers, type Player } from "@/store/players";
import { createDealer } from "@/lib/random";
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

  const chickenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (chickenTimerRef.current !== null) {
        clearTimeout(chickenTimerRef.current);
        chickenTimerRef.current = null;
      }
    };
  }, []);

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
    if (chickenTimerRef.current !== null) {
      clearTimeout(chickenTimerRef.current);
    }
    chickenTimerRef.current = setTimeout(() => {
      chickenTimerRef.current = null;
      setShowDrink(false);
      setPhase("pick");
      if (hasPlayers) setTurnIndex((t) => t + 1);
    }, 2200);
  }

  function resetGame() {
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
      <GameHeading
        title="Truth or Dare"
        subtitle="Pick your poison. Chicken out and take a drink."
        accent={ACCENT}
      />

      {/* Player turn indicator */}
      {hasPlayers && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {players.map((p, i) => (
            <PlayerChip
              key={p.id}
              player={p}
              active={i === turnIndex % players.length}
            />
          ))}
        </div>
      )}

      {/* Current player label */}
      <AnimatePresence mode="wait">
        {currentPlayer && phase === "pick" && (
          <motion.p
            key={`lbl-${currentPlayer.id}-${turnIndex}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-white/60 text-sm mb-6 text-center"
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
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {/* Truth — cyan glow wrapper since NeonButton has no style prop */}
              <div
                className="flex-1 sm:flex-none sm:min-w-[160px] rounded-2xl"
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
              </div>

              {/* Dare */}
              <div className="flex-1 sm:flex-none sm:min-w-[160px]">
                <NeonButton
                  variant="danger"
                  size="lg"
                  onClick={() => pick("dare")}
                  className="w-full text-xl font-display tracking-widest uppercase"
                >
                  🔥 Dare
                </NeonButton>
              </div>
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
              {/* Type badge */}
              <div className="flex justify-center mb-3">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full"
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
                </span>
              </div>

              {/* Prompt glass card */}
              <div
                className="glass-strong rounded-3xl p-6 sm:p-8 text-center mb-6"
                style={cardGlow}
              >
                <p className="text-white text-lg sm:text-xl leading-relaxed font-medium">
                  {prompt}
                </p>
              </div>

              {/* Drink callout */}
              <div className="flex justify-center min-h-[3.5rem] mb-4">
                <AnimatePresence>
                  {showDrink && (
                    <DrinkCallout
                      text={
                        currentPlayer
                          ? `${currentPlayer.name}, drink up! 🍺`
                          : "Drink up! 🍺"
                      }
                      accent={ACCENT}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons (hidden while drink callout is showing) */}
              {!showDrink && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      <button
        onClick={resetGame}
        className="mt-10 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
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
