"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useCallback, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTimeouts } from "@/lib/timers";
import {
  NeonButton,
  DrinkCallout,
  PlayerChip,
  RequirePlayers,
} from "@/components/ui";
import { createDealer } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { drinkRain, pop } from "@/lib/confetti";
import type { Player } from "@/store/players";
import { BLOCK_DARES } from "./data";

const ACCENT = "#2de2c0";
const TOTAL_BLOCKS = 14;

// Collapse probability ramp: each step maps remaining blocks → odds (0-1)
function collapseProbability(remaining: number): number {
  if (remaining >= 12) return 0.04;
  if (remaining >= 10) return 0.08;
  if (remaining >= 8) return 0.13;
  if (remaining >= 6) return 0.22;
  if (remaining >= 4) return 0.35;
  if (remaining >= 2) return 0.55;
  return 1; // last block always falls
}

export default function DrunkJenga() {
  return (
    <RequirePlayers min={2} accent={ACCENT}>
      {(players: Player[]) => <JengaGame players={players} />}
    </RequirePlayers>
  );
}

function JengaGame({ players }: { players: Player[] }) {
  const dealerRef = useRef(createDealer(BLOCK_DARES));

  const [blocks, setBlocks] = useState<number[]>(() =>
    Array.from({ length: TOTAL_BLOCKS }, (_, i) => i),
  );
  const [pulledId, setPulledId] = useState<number | null>(null);
  const [dare, setDare] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [puller, setPuller] = useState<Player | null>(null);
  const [turnIdx, setTurnIdx] = useState(0);
  const [pulling, setPulling] = useState(false);

  const towerControls = useAnimationControls();
  const { after, clearAll } = useTimeouts();

  const triggerCollapse = useCallback(
    (who: Player) => {
      setCollapsed(true);
      setPuller(who);
      sfx.buzz();
      drinkRain();
      void towerControls.start({
        rotate: [0, -12, 18, -25, 35, -45, 60],
        x: [0, -8, 12, -20, 30, -50, 80],
        opacity: [1, 1, 1, 0.8, 0.5, 0.2, 0],
        transition: { duration: 0.9, ease: "easeIn" },
      });
    },
    [towerControls],
  );

  function handlePull() {
    if (pulling || collapsed || blocks.length === 0) return;

    const current = players[turnIdx % players.length];
    setPulling(true);
    sfx.whoosh();

    const removedId = blocks[Math.floor(Math.random() * blocks.length)];
    setPulledId(removedId);

    after(420, () => {
      const newBlocks = blocks.filter((b) => b !== removedId);
      setBlocks(newBlocks);
      const nextDare = dealerRef.current.next();
      setDare(nextDare);
      sfx.flip();

      // Apply slight wobble to tower as it settles
      const wobble = ((TOTAL_BLOCKS - newBlocks.length) / TOTAL_BLOCKS) * 6;
      void towerControls.start({
        rotate: [0, wobble * 0.6, -wobble * 0.4, wobble * 0.25, 0],
        transition: { duration: 0.55, ease: EASE_OUT },
      });

      // Decide collapse
      const prob = collapseProbability(newBlocks.length);
      const falls = Math.random() < prob;

      if (falls) {
        after(700, () => {
          triggerCollapse(current);
          setPulling(false); // keep pulling state consistent after the collapse settles
        });
      } else {
        // Re-enable pulling only after the settle wobble (0.55s) finishes,
        // so a rapid tap can't start a new pull mid-animation (double-pull).
        after(550, () => setPulling(false));
      }
    });
  }

  function advanceTurn() {
    sfx.click();
    setTurnIdx((t) => t + 1);
    setPulledId(null);
    setDare(null);
    setPulling(false);
  }

  function reset() {
    clearAll();
    dealerRef.current = createDealer(BLOCK_DARES);
    setBlocks(Array.from({ length: TOTAL_BLOCKS }, (_, i) => i));
    setPulledId(null);
    setDare(null);
    setCollapsed(false);
    setPuller(null);
    setPulling(false);
    void towerControls.start({ rotate: 0, x: 0, opacity: 1 });
    pop(0.5, 0.5);
  }

  const currentPlayer = players[turnIdx % players.length];
  const wobbleDeg = ((TOTAL_BLOCKS - blocks.length) / TOTAL_BLOCKS) * 8;
  const remaining = blocks.length;
  const pct = Math.round(collapseProbability(remaining) * 100);

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      <p className="text-white/50 text-xs sm:text-sm text-center mb-2 sm:mb-3">
        Pull a block — do the dare or take a drink. Don&apos;t let it fall!
      </p>

      {/* Player turn strip */}
      <motion.div layout className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={!collapsed && i === turnIdx % players.length}
          />
        ))}
      </motion.div>

      <div className="h-5 mb-1 sm:mb-2 flex items-center">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.p
              key={currentPlayer.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs sm:text-sm text-white/55"
            >
              <span style={{ color: currentPlayer.color }} className="font-semibold">
                {currentPlayer.name}
              </span>
              &apos;s turn — pull a block
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tower */}
      <motion.div
        animate={towerControls}
        className="relative mb-3 sm:mb-4"
        style={{ originX: "50%", originY: "100%" }}
      >
        <div
          className="flex flex-col-reverse gap-[2px] sm:gap-[3px]"
          style={{
            filter: collapsed ? "none" : `drop-shadow(0 0 ${6 + wobbleDeg}px ${ACCENT}55)`,
          }}
        >
          {Array.from({ length: TOTAL_BLOCKS }, (_, i) => {
            const present = blocks.includes(i);
            const beingPulled = pulledId === i;
            const rowIndex = i; // used for alternating row orientation hint
            return (
              <AnimatePresence key={i} mode="popLayout">
                {present && (
                  <motion.div
                    key={`block-${i}`}
                    layout
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: { type: "spring", stiffness: 320, damping: 22, delay: i * 0.025 },
                    }}
                    exit={
                      beingPulled
                        ? { x: rowIndex % 2 === 0 ? 140 : -140, opacity: 0, rotate: rowIndex % 2 === 0 ? 8 : -8, transition: { duration: 0.38, ease: EASE_OUT } }
                        : { opacity: 0, transition: { duration: 0.15 } }
                    }
                    className="rounded-sm w-[120px] h-[14px] sm:w-[160px] sm:h-[18px] [@media(max-height:520px)]:h-[11px] [@media(max-height:520px)]:w-[150px]"
                    style={{
                      background: `linear-gradient(90deg, ${ACCENT}22, ${ACCENT}44, ${ACCENT}22)`,
                      border: `1px solid ${ACCENT}66`,
                      boxShadow: beingPulled ? `0 0 18px -2px ${ACCENT}` : undefined,
                      // Slight offset alternation to mimic stacking layers
                      marginLeft: i % 3 === 0 ? -4 : i % 3 === 1 ? 0 : 4,
                    }}
                  />
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </motion.div>

      {/* Danger meter */}
      {!collapsed && (
        <div className="w-44 sm:w-48 mb-3 sm:mb-4">
          <div className="flex justify-between text-[10px] sm:text-xs text-white/40 mb-1">
            <span>Collapse risk</span>
            <motion.span
              key={pct}
              initial={{ scale: 1.5, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="inline-block tabular-nums font-semibold"
              style={{ color: pct > 40 ? "#ff5e5b" : ACCENT }}
            >
              {pct}%
            </motion.span>
          </div>
          <div className="h-2 rounded-full glass overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              style={{
                background:
                  pct > 50
                    ? "linear-gradient(90deg,#ffb627,#ff5e5b)"
                    : `linear-gradient(90deg,${ACCENT},#18e7ff)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Dare reveal — fixed compact slot; collapse callout overlays larger */}
      <div className="relative min-h-[5rem] sm:min-h-[6rem] [@media(max-height:520px)]:min-h-0 w-full max-w-sm mb-3 sm:mb-4 [@media(max-height:520px)]:mb-2 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {collapsed && puller ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.85, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="glass-strong rounded-3xl p-4 sm:p-6 text-center w-full"
              style={{ boxShadow: `0 0 60px -12px #ff5e5b` }}
            >
              <motion.div
                className="text-4xl sm:text-5xl mb-2 sm:mb-3"
                animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6 }}
              >
                💥
              </motion.div>
              <DrinkCallout
                text={`Tower fell — ${puller.name} drinks big!`}
                accent="#ff5e5b"
              />
            </motion.div>
          ) : dare ? (
            <motion.div
              key={`dare-${dare}`}
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="glass-strong rounded-3xl p-4 sm:p-5 text-center w-full"
              style={{ boxShadow: `0 0 36px -14px ${ACCENT}` }}
            >
              <motion.div
                className="text-2xl sm:text-3xl mb-1.5 sm:mb-2"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 14, delay: 0.08 }}
              >
                🧱
              </motion.div>
              <p className="text-white/90 leading-snug font-medium text-sm sm:text-base">{dare}</p>
              <p className="text-white/40 text-xs mt-1.5 sm:mt-2">Do it — or take a drink.</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/40 text-sm"
            >
              {remaining} blocks remaining — pull one to reveal a dare.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap justify-center">
        {collapsed ? (
          <NeonButton onClick={reset} size="lg" variant="success">
            <RotateCcw size={16} className="inline mr-1" /> Rebuild Tower
          </NeonButton>
        ) : dare ? (
          <NeonButton onClick={advanceTurn} size="lg" variant="primary">
            Next player →
          </NeonButton>
        ) : (
          <NeonButton
            onClick={handlePull}
            size="lg"
            variant="primary"
            disabled={pulling || blocks.length === 0}
          >
            Pull a block 🧱
          </NeonButton>
        )}
      </div>

      {/* Block count footer */}
      {!collapsed && (
        <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-white/25">
          <motion.span
            key={remaining}
            initial={{ scale: 1.4, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="inline-block tabular-nums"
          >
            {remaining}
          </motion.span>
          /{TOTAL_BLOCKS} blocks standing
        </p>
      )}
    </motion.div>
  );
}
