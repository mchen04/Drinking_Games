"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { useTimeouts } from "@/lib/timers";
import {
  RequirePlayers,
  NeonButton,
  DrinkCallout,
  PlayerChip,
} from "@/components/ui";
import type { Player } from "@/store/players";
import { createDealer } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { QUESTIONS } from "./data";

const ACCENT = "#ff2d95";

export default function Paranoia() {
  return (
    <RequirePlayers min={4} accent={ACCENT}>
      {(players) => <ParanoiaGame players={players} />}
    </RequirePlayers>
  );
}

// ─── game phases ────────────────────────────────────────────────────────────
type Phase =
  | "pass"       // "pass phone to asker"
  | "read"       // asker privately views question
  | "asked"      // asker has asked aloud; enter the named person
  | "flip"       // coin flip decision
  | "revealed"   // question revealed + drink callout
  | "secret";    // tails — stays secret

// ─── coin helpers ────────────────────────────────────────────────────────────
type CoinSide = "heads" | "tails";

function useCoinFlip(onDone: (result: CoinSide) => void) {
  const [spinning, setSpinning] = useState(false);
  const [side, setSide] = useState<CoinSide | null>(null);
  const { after, clearAll } = useTimeouts();
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  function flip() {
    clearAll(); // cancel any in-flight flip before starting a new one
    setSpinning(true);
    setSide(null);
    sfx.whoosh();
    after(1200, () => {
      const result: CoinSide = Math.random() < 0.5 ? "heads" : "tails";
      setSide(result);
      setSpinning(false);
      onDoneRef.current(result);
    });
  }

  return { flip, spinning, side, cancel: clearAll };
}

// ─── main game ───────────────────────────────────────────────────────────────
function ParanoiaGame({ players }: { players: Player[] }) {
  const dealerRef = useRef(createDealer(QUESTIONS));
  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("pass");
  const [question, setQuestion] = useState<string>("");
  const [namedPerson, setNamedPerson] = useState<string>("");
  const [roundCount, setRoundCount] = useState(1);

  const asker = players[turnIdx % players.length];

  // ── coin flip ──
  const { flip, spinning, side: coinSide, cancel: cancelFlip } = useCoinFlip((result) => {
    if (result === "heads") {
      sfx.ding();
      pop(0.5, 0.35);
      drinkRain();
      setPhase("revealed");
    } else {
      sfx.buzz();
      setPhase("secret");
    }
  });

  function startRound() {
    const q = dealerRef.current.next();
    setQuestion(q);
    setNamedPerson("");
    setPhase("read");
    sfx.flip();
  }

  function advanceToAsked() {
    setPhase("asked");
    sfx.click();
  }

  function confirmName() {
    const trimmed = namedPerson.trim();
    if (!trimmed) return;
    setPhase("flip");
    sfx.tick();
  }

  function nextRound() {
    cancelFlip();
    setTurnIdx((i) => i + 1);
    setRoundCount((r) => r + 1);
    setQuestion("");
    setNamedPerson("");
    setPhase("pass");
    sfx.click();
  }

  function resetGame() {
    cancelFlip();
    dealerRef.current = createDealer(QUESTIONS);
    setTurnIdx(0);
    setRoundCount(1);
    setQuestion("");
    setNamedPerson("");
    setPhase("pass");
  }

  return (
    <div className="flex flex-col items-center px-2 w-full">
      <p className="text-white/50 text-sm text-center mb-3">
        <span className="text-white/70 font-semibold">Round {roundCount}</span>
        {" · "}The question stays secret — unless they dare to flip.
      </p>

      {/* player chips */}
      <motion.div layout className="flex flex-wrap justify-center gap-2 mb-4">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turnIdx % players.length}
          />
        ))}
      </motion.div>

      {/* phase content */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {/* ── PASS ── */}
          {phase === "pass" && (
            <PhaseCard key="pass">
              <motion.div
                className="text-5xl mb-3"
                animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                📱
              </motion.div>
              <p className="text-white/60 text-sm mb-0.5">Pass the phone to</p>
              <motion.p
                key={asker.id}
                className="font-display text-2xl mb-3"
                style={{ color: asker.color }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
              >
                {asker.name}
              </motion.p>
              <p className="text-white/40 text-xs mb-4">
                Only {asker.name} should be looking at the screen.
              </p>
              <NeonButton onClick={startRound} size="lg" variant="primary">
                Ready — reveal my question
              </NeonButton>
            </PhaseCard>
          )}

          {/* ── READ ── */}
          {phase === "read" && (
            <PhaseCard key="read">
              <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                <Eye size={14} />
                <span>Only you can see this</span>
              </div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
                Your question
              </p>
              <motion.div
                className="glass-strong rounded-2xl p-4 text-center mb-4"
                style={{ boxShadow: `0 0 40px -12px ${ACCENT}` }}
                initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-white leading-relaxed text-base sm:text-lg font-medium">
                  {question}
                </p>
              </motion.div>
              <p className="text-white/40 text-xs mb-4 text-center">
                Ask this question aloud — but don&apos;t reveal the words.
                The group shouts a name. Then tap below.
              </p>
              <NeonButton onClick={advanceToAsked} size="lg" variant="primary">
                I asked it — they answered
              </NeonButton>
            </PhaseCard>
          )}

          {/* ── ASKED ── */}
          {phase === "asked" && (
            <PhaseCard key="asked">
              <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                <EyeOff size={14} />
                <span>Question is still secret</span>
              </div>
              <p className="text-white/70 text-sm text-center mb-4">
                Who did <b style={{ color: asker.color }}>{asker.name}</b> point to?
              </p>
              <input
                type="text"
                value={namedPerson}
                onChange={(e) => setNamedPerson(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmName()}
                placeholder="Type the named person's name…"
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-white text-center",
                  "bg-white/10 border border-white/15 focus:border-[#ff2d95]",
                  "outline-none placeholder:text-white/25 mb-4 text-sm",
                )}
                autoFocus
              />
              <NeonButton
                onClick={confirmName}
                size="lg"
                variant="primary"
                disabled={!namedPerson.trim()}
              >
                Confirm →
              </NeonButton>
            </PhaseCard>
          )}

          {/* ── FLIP ── */}
          {phase === "flip" && (
            <PhaseCard key="flip">
              <p className="text-white/60 text-sm text-center mb-0.5">
                The group pointed at
              </p>
              <motion.p
                className="font-display text-2xl text-center mb-3"
                style={{ color: ACCENT }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                {namedPerson}
              </motion.p>
              <p className="text-white/60 text-sm text-center mb-5">
                <b style={{ color: ACCENT }}>{namedPerson}</b>, do you dare
                flip the coin?
                <br />
                <span className="text-white/35 text-xs">
                  Heads = question revealed (you drink).{" "}
                  Tails = stays secret forever.
                </span>
              </p>

              {/* Coin — 3D dual-face flip */}
              <div className="flex justify-center mb-5" style={{ perspective: 800 }}>
                {/* glow halo that pulses while spinning */}
                <motion.div
                  className="relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer select-none"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={
                    spinning
                      ? {
                          rotateY: [0, 360, 720, 1080, 1440, 1800],
                          rotateX: [0, 12, -8, 6, 0],
                          y: [0, -28, -10, -24, 0],
                          scale: [1, 1.12, 1.06, 1.12, 1],
                        }
                      : coinSide === "tails"
                      ? { rotateY: 180, rotateX: 0, y: 0, scale: 1 }
                      : { rotateY: 0, rotateX: 0, y: 0, scale: 1 }
                  }
                  transition={
                    spinning
                      ? { duration: 1.2, ease: [0.22, 0.7, 0.3, 1] }
                      : { type: "spring", stiffness: 260, damping: 18 }
                  }
                  onClick={!spinning && !coinSide ? flip : undefined}
                >
                  {/* HEADS face */}
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background:
                        "radial-gradient(circle at 35% 30%, #fff0b0, #e8c200 55%, #b08800)",
                      boxShadow: spinning
                        ? `0 0 44px -4px ${ACCENT}, inset 0 0 14px rgba(255,255,255,0.5)`
                        : `0 0 24px -8px ${ACCENT}, inset 0 0 12px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.45)`,
                    }}
                  >
                    <span
                      className="font-display text-2xl sm:text-3xl text-[#7a5c00]"
                      style={{ textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}
                    >
                      H
                    </span>
                  </div>
                  {/* TAILS face (rotated 180°) */}
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background:
                        "radial-gradient(circle at 35% 30%, #ffe0a0, #d9b000 55%, #9c7400)",
                      boxShadow: spinning
                        ? `0 0 44px -4px #9d4edd, inset 0 0 14px rgba(255,255,255,0.5)`
                        : `0 0 24px -8px #9d4edd, inset 0 0 12px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.45)`,
                    }}
                  >
                    <span
                      className="font-display text-2xl sm:text-3xl text-[#5c4a00]"
                      style={{ textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}
                    >
                      T
                    </span>
                  </div>
                </motion.div>
              </div>

              {!coinSide && !spinning && (
                <NeonButton onClick={flip} size="lg" variant="primary">
                  Flip the coin!
                </NeonButton>
              )}
              {spinning && (
                <motion.p
                  className="text-white/50 text-sm text-center"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                >
                  Flipping…
                </motion.p>
              )}
            </PhaseCard>
          )}

          {/* ── REVEALED ── */}
          {phase === "revealed" && (
            <PhaseCard key="revealed">
              <motion.div
                className="text-4xl mb-2 text-center"
                initial={{ rotateY: 0, scale: 0.6 }}
                animate={{ rotateY: [0, 720], scale: [0.6, 1.25, 1] }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                🪙
              </motion.div>
              <motion.p
                className="font-display text-xl text-center mb-1.5"
                style={{ color: "#ffe066" }}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.15 }}
              >
                HEADS — Revealed!
              </motion.p>
              <p className="text-white/50 text-xs text-center mb-3">
                The question was…
              </p>
              <motion.div
                className="glass-strong rounded-2xl p-4 text-center mb-4"
                style={{ boxShadow: `0 0 48px -10px ${ACCENT}` }}
                initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              >
                <p className="text-white leading-relaxed text-sm sm:text-base">{question}</p>
              </motion.div>
              <div className="flex justify-center mb-4">
                <DrinkCallout
                  text={`${namedPerson} drinks!`}
                  accent={ACCENT}
                />
              </div>
              <NeonButton onClick={nextRound} size="lg" variant="primary">
                Next round →
              </NeonButton>
            </PhaseCard>
          )}

          {/* ── SECRET ── */}
          {phase === "secret" && (
            <PhaseCard key="secret">
              <motion.div
                className="text-4xl mb-2 text-center"
                initial={{ scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: [-12, 8, -4, 0] }}
                transition={{ type: "spring", stiffness: 300, damping: 14 }}
              >
                🤫
              </motion.div>
              <motion.p
                className="font-display text-xl text-center mb-1.5"
                style={{ color: "#9d4edd" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              >
                TAILS — Stays secret!
              </motion.p>
              <p className="text-white/50 text-xs text-center mb-4">
                The question is gone forever. Only{" "}
                <b style={{ color: asker.color }}>{asker.name}</b> knows.
              </p>
              <motion.div
                className="glass rounded-2xl p-4 text-center mb-4 border border-white/10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <p className="text-white/30 text-sm blur-sm select-none">
                  {question}
                </p>
                <p className="text-white/20 text-xs mt-2">redacted</p>
              </motion.div>
              <NeonButton onClick={nextRound} size="lg" variant="primary">
                Next round →
              </NeonButton>
            </PhaseCard>
          )}

        </AnimatePresence>
      </div>

      {/* reset */}
      {roundCount > 1 && (
        <button
          onClick={resetGame}
          className="mt-3 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
        >
          <RotateCcw size={13} /> restart game
        </button>
      )}
    </div>
  );
}

// ─── reusable animated card wrapper ─────────────────────────────────────────
function PhaseCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center"
      style={{ boxShadow: "0 0 60px -20px #ff2d95" }}
    >
      {children}
    </motion.div>
  );
}
