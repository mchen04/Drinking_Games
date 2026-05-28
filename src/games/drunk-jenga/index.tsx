"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useTimeouts } from "@/lib/timers";
import {
  NeonButton,
  GameHeading,
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
        transition: { duration: 0.55, ease: "easeOut" },
      });

      // Decide collapse
      const prob = collapseProbability(newBlocks.length);
      const falls = Math.random() < prob;

      if (falls) {
        after(700, () => triggerCollapse(current));
      } else {
        setPulling(false);
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
    <div className="flex flex-col items-center">
      <GameHeading
        title="Drunk Jenga"
        subtitle="Pull a block — do the dare or take a drink. Don't let it fall!"
        accent={ACCENT}
      />

      {/* Player turn strip */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={!collapsed && i === turnIdx % players.length}
          />
        ))}
      </div>

      {!collapsed && (
        <p className="text-sm text-white/55 mb-4">
          <span style={{ color: currentPlayer.color }} className="font-semibold">
            {currentPlayer.name}
          </span>
          &apos;s turn — pull a block
        </p>
      )}

      {/* Tower */}
      <motion.div
        animate={towerControls}
        className="relative mb-6"
        style={{ originX: "50%", originY: "100%" }}
      >
        <div
          className="flex flex-col-reverse gap-[3px]"
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
                    initial={{ opacity: 1, x: 0 }}
                    exit={
                      beingPulled
                        ? { x: rowIndex % 2 === 0 ? 140 : -140, opacity: 0, transition: { duration: 0.38 } }
                        : { opacity: 0, transition: { duration: 0.15 } }
                    }
                    className="rounded-sm"
                    style={{
                      width: 160,
                      height: 20,
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
        <div className="w-48 mb-5">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>Collapse risk</span>
            <span style={{ color: pct > 40 ? "#ff5e5b" : ACCENT }}>{pct}%</span>
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

      {/* Dare reveal */}
      <div className="min-h-[7rem] w-full max-w-sm mb-4">
        <AnimatePresence mode="wait">
          {collapsed && puller ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-3xl p-6 text-center"
              style={{ boxShadow: `0 0 60px -12px #ff5e5b` }}
            >
              <div className="text-5xl mb-3">💥</div>
              <DrinkCallout
                text={`Tower fell — ${puller.name} drinks big!`}
                accent="#ff5e5b"
              />
            </motion.div>
          ) : dare ? (
            <motion.div
              key={`dare-${dare}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-strong rounded-3xl p-5 text-center"
              style={{ boxShadow: `0 0 36px -14px ${ACCENT}` }}
            >
              <div className="text-3xl mb-2">🧱</div>
              <p className="text-white/90 leading-snug font-medium">{dare}</p>
              <p className="text-white/40 text-xs mt-2">Do it — or take a drink.</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-center text-white/40 pt-6"
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
        <p className="mt-6 text-xs text-white/25">
          {remaining}/{TOTAL_BLOCKS} blocks standing
        </p>
      )}
    </div>
  );
}
