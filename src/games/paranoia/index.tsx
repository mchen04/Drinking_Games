"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import {
  RequirePlayers,
  GameHeading,
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  function flip() {
    // Clear any orphaned timer before starting a new one
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSpinning(true);
    setSide(null);
    sfx.whoosh();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const result: CoinSide = Math.random() < 0.5 ? "heads" : "tails";
      setSide(result);
      setSpinning(false);
      onDoneRef.current(result);
    }, 1200);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { flip, spinning, side };
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
  const { flip, spinning, side: coinSide } = useCoinFlip((result) => {
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
    setTurnIdx((i) => i + 1);
    setRoundCount((r) => r + 1);
    setQuestion("");
    setNamedPerson("");
    setPhase("pass");
    sfx.click();
  }

  function resetGame() {
    dealerRef.current = createDealer(QUESTIONS);
    setTurnIdx(0);
    setRoundCount(1);
    setQuestion("");
    setNamedPerson("");
    setPhase("pass");
  }

  return (
    <div className="flex flex-col items-center px-2 pb-8">
      <GameHeading
        title="Paranoia"
        subtitle={`Round ${roundCount} · The question stays secret — unless they dare to flip.`}
        accent={ACCENT}
      />

      {/* player chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {players.map((p, i) => (
          <PlayerChip
            key={p.id}
            player={p}
            active={i === turnIdx % players.length}
          />
        ))}
      </div>

      {/* phase content */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {/* ── PASS ── */}
          {phase === "pass" && (
            <PhaseCard key="pass">
              <div className="text-5xl mb-4">📱</div>
              <p className="text-white/60 text-sm mb-1">Pass the phone to</p>
              <p
                className="font-display text-2xl mb-6"
                style={{ color: asker.color }}
              >
                {asker.name}
              </p>
              <p className="text-white/40 text-xs mb-6">
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
              <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                <Eye size={14} />
                <span>Only you can see this</span>
              </div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-3">
                Your question
              </p>
              <div
                className="glass-strong rounded-2xl p-5 text-center mb-6"
                style={{ boxShadow: `0 0 40px -12px ${ACCENT}` }}
              >
                <p className="text-white leading-relaxed text-lg font-medium">
                  {question}
                </p>
              </div>
              <p className="text-white/40 text-xs mb-6 text-center">
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
              <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                <EyeOff size={14} />
                <span>Question is still secret</span>
              </div>
              <p className="text-white/70 text-sm text-center mb-5">
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
                  "outline-none placeholder:text-white/25 mb-5 text-sm",
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
              <p className="text-white/60 text-sm text-center mb-1">
                The group pointed at
              </p>
              <p
                className="font-display text-2xl text-center mb-6"
                style={{ color: ACCENT }}
              >
                {namedPerson}
              </p>
              <p className="text-white/60 text-sm text-center mb-8">
                <b style={{ color: ACCENT }}>{namedPerson}</b>, do you dare
                flip the coin?
                <br />
                <span className="text-white/35 text-xs">
                  Heads = question revealed (you drink).{" "}
                  Tails = stays secret forever.
                </span>
              </p>

              {/* Coin */}
              <div className="flex justify-center mb-8">
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center cursor-pointer select-none"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffe680, #c8a800)`,
                    boxShadow: spinning
                      ? `0 0 40px -6px ${ACCENT}, 0 4px 24px rgba(0,0,0,0.5)`
                      : `0 0 20px -8px ${ACCENT}, 0 4px 12px rgba(0,0,0,0.4)`,
                  }}
                  animate={
                    spinning
                      ? { rotateY: [0, 180, 360, 540, 720, 900, 1080], scale: [1, 1.1, 1] }
                      : coinSide
                      ? { rotateY: 0, scale: 1 }
                      : { rotateY: 0, scale: 1 }
                  }
                  transition={spinning ? { duration: 1.2, ease: "easeInOut" } : { duration: 0.3 }}
                  onClick={!spinning && !coinSide ? flip : undefined}
                >
                  <span className="text-3xl" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                    {coinSide === "heads" ? "H" : coinSide === "tails" ? "T" : "🪙"}
                  </span>
                </motion.div>
              </div>

              {!coinSide && !spinning && (
                <NeonButton onClick={flip} size="lg" variant="primary">
                  Flip the coin!
                </NeonButton>
              )}
              {spinning && (
                <p className="text-white/50 text-sm text-center animate-pulse">
                  Flipping…
                </p>
              )}
            </PhaseCard>
          )}

          {/* ── REVEALED ── */}
          {phase === "revealed" && (
            <PhaseCard key="revealed">
              <div className="text-4xl mb-3 text-center">🪙</div>
              <p className="font-display text-xl text-center mb-2" style={{ color: "#ffe066" }}>
                HEADS — Revealed!
              </p>
              <p className="text-white/50 text-xs text-center mb-4">
                The question was…
              </p>
              <div
                className="glass-strong rounded-2xl p-5 text-center mb-6"
                style={{ boxShadow: `0 0 48px -10px ${ACCENT}` }}
              >
                <p className="text-white leading-relaxed">{question}</p>
              </div>
              <div className="flex justify-center mb-6">
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
              <div className="text-4xl mb-3 text-center">🤫</div>
              <p
                className="font-display text-xl text-center mb-2"
                style={{ color: "#9d4edd" }}
              >
                TAILS — Stays secret!
              </p>
              <p className="text-white/50 text-xs text-center mb-6">
                The question is gone forever. Only{" "}
                <b style={{ color: asker.color }}>{asker.name}</b> knows.
              </p>
              <div
                className="glass rounded-2xl p-4 text-center mb-6 border border-white/10"
              >
                <p className="text-white/30 text-sm blur-sm select-none">
                  {question}
                </p>
                <p className="text-white/20 text-xs mt-2">redacted</p>
              </div>
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
          className="mt-10 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
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
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="glass-strong rounded-3xl p-6 flex flex-col items-center text-center"
      style={{ boxShadow: "0 0 60px -20px #ff2d95" }}
    >
      {children}
    </motion.div>
  );
}
