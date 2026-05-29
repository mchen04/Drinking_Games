"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { NeonButton, DrinkCallout, PlayerChip } from "@/components/ui";
import { usePlayers } from "@/store/players";
import { shuffle } from "@/lib/random";
import { sfx } from "@/lib/sound";
import { pop, drinkRain } from "@/lib/confetti";
import { QUESTIONS, type TriviaQuestion } from "./data";

const ACCENT = "#6c5ce7";

/** Shuffle a question's options and return new options + remapped answer index. */
function shuffleOptions(q: TriviaQuestion): { options: string[]; answer: number } {
  const indexed = q.options.map((opt, i) => ({ opt, i }));
  const shuffled = shuffle(indexed);
  const newAnswer = shuffled.findIndex((x) => x.i === q.answer);
  return { options: shuffled.map((x) => x.opt), answer: newAnswer };
}

type AnswerState = "idle" | "correct" | "wrong";

interface QuestionView {
  question: TriviaQuestion;
  options: string[];
  answer: number;
}

function buildQueue(): QuestionView[] {
  return shuffle(QUESTIONS).map((q) => {
    const { options, answer } = shuffleOptions(q);
    return { question: q, options, answer };
  });
}

export default function DrunkTrivia() {
  // Trivia is playable solo (registry "1+"): players are OPTIONAL and only enable
  // turn rotation, so this game intentionally does NOT gate behind RequirePlayers.
  const { players } = usePlayers();
  const hasPlayers = players.length > 0;

  // Queue: non-repeating shuffled questions
  const [queue, setQueue] = useState<QuestionView[]>(() => buildQueue());
  const [queueIndex, setQueueIndex] = useState(0);

  // Score tracking
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  // Per-turn state
  const [picked, setPicked] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");

  // Player rotation
  const [turn, setTurn] = useState(0);

  const currentView: QuestionView = queue[queueIndex];

  const currentPlayer = hasPlayers ? players[turn % players.length] : null;

  function handlePick(optionIndex: number) {
    if (answerState !== "idle") return;

    setPicked(optionIndex);
    const isCorrect = optionIndex === currentView.answer;

    if (isCorrect) {
      sfx.ding();
      pop(0.5, 0.4);
      setAnswerState("correct");
      setScore((s) => s + 1);
    } else {
      sfx.buzz();
      drinkRain();
      setAnswerState("wrong");
    }

    setAnswered((a) => a + 1);
  }

  function handleNext() {
    setPicked(null);
    setAnswerState("idle");

    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      // Rebuild and restart
      setQueue(buildQueue());
      setQueueIndex(0);
    } else {
      setQueueIndex(nextIndex);
    }

    if (hasPlayers) {
      setTurn((t) => t + 1);
    }
  }

  function handleReset() {
    setQueue(buildQueue());
    setQueueIndex(0);
    setScore(0);
    setAnswered(0);
    setPicked(null);
    setAnswerState("idle");
    setTurn(0);
  }

  function buttonVariant(optionIndex: number): "primary" | "ghost" | "danger" | "success" {
    if (answerState === "idle") return optionIndex === 0 ? "primary" : "ghost";
    if (optionIndex === currentView.answer) return "success";
    if (optionIndex === picked && answerState === "wrong") return "danger";
    return "ghost";
  }

  const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <p className="text-white/50 text-sm text-center mb-3">
        Pick the right answer or take a drink!
      </p>

      {/* Player rotation strip */}
      {hasPlayers && (
        <motion.div layout className="flex flex-wrap justify-center gap-2 mb-3">
          <AnimatePresence initial={false}>
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <PlayerChip player={p} active={i === turn % players.length} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Score bar */}
      <div className="flex items-center gap-4 mb-3 text-sm text-white/55">
        <span>
          Score{" "}
          <span className="relative inline-flex justify-center">
            <AnimatePresence mode="popLayout">
              <motion.b
                key={score}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="inline-block font-bold"
                style={{ color: ACCENT }}
              >
                {score}
              </motion.b>
            </AnimatePresence>
          </span>
        </span>
        <span className="text-white/25">·</span>
        <span>
          Answered <b className="text-white">{answered}</b>
        </span>
        <span className="text-white/25">·</span>
        <span>
          Accuracy <b className="text-white">{accuracy}%</b>
        </span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={queueIndex}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong rounded-3xl px-5 py-4 sm:p-6 mb-3 w-full text-center"
          style={{ boxShadow: `0 0 48px -16px ${ACCENT}` }}
        >
          {/* Category chip */}
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 300, damping: 20 }}
            className="inline-block text-xs font-semibold uppercase tracking-widest rounded-full px-3 py-1 mb-2.5"
            style={{ background: `${ACCENT}33`, color: ACCENT }}
          >
            {currentView.question.category}
          </motion.span>

          {currentPlayer && (
            <p className="text-sm text-white/50 mb-1.5">
              <b style={{ color: currentPlayer.color }}>{currentPlayer.name}</b>
              &apos;s turn
            </p>
          )}

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-white text-base sm:text-xl font-semibold leading-snug"
          >
            {currentView.question.q}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Answer options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={queueIndex + "-opts"}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mb-3"
        >
          {currentView.options.map((opt, i) => {
            const variant = buttonVariant(i);
            const isCorrectReveal = answerState !== "idle" && i === currentView.answer;
            const isWrongPick = answerState === "wrong" && i === picked;
            return (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.96 },
                  show: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                animate={
                  isCorrectReveal
                    ? { opacity: 1, y: 0, scale: [1, 1.08, 1] }
                    : isWrongPick
                    ? { opacity: 1, y: 0, x: [0, -10, 10, -6, 6, 0] }
                    : "show"
                }
                style={
                  isCorrectReveal
                    ? { filter: "drop-shadow(0 0 14px rgba(182,255,60,0.55))" }
                    : undefined
                }
              >
                <NeonButton
                  fullWidth
                  size="md"
                  variant={variant}
                  disabled={answerState !== "idle"}
                  sound={answerState === "idle"}
                  onClick={() => handlePick(i)}
                  className={
                    answerState !== "idle" && i !== currentView.answer && i !== picked
                      ? "text-left justify-start opacity-30"
                      : "text-left justify-start"
                  }
                >
                  <span className="mr-2 opacity-50 font-mono text-sm">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </NeonButton>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Result feedback */}
      <div className="min-h-[3rem] flex flex-col items-center gap-2.5 mb-2">
        <AnimatePresence mode="wait">
          {answerState === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
              <DrinkCallout
                text={currentPlayer ? `${currentPlayer.name}, drink!` : "Wrong — drink!"}
                accent="#ff5e5b"
              />
            </motion.div>
          )}
          {answerState === "correct" && (
            <motion.p
              key="correct"
              initial={{ opacity: 0, scale: 0.6, y: 6 }}
              animate={{ opacity: 1, scale: [0.6, 1.15, 1], y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 340, damping: 16 }}
              className="font-display text-xl neon-text"
              style={{ color: "#b6ff3c" }}
            >
              Correct! 🎉
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {answerState !== "idle" && (
            <motion.button
              key="next"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              onClick={handleNext}
              className="font-semibold tracking-wide border border-white/20 px-7 py-3 text-base rounded-2xl text-white select-none"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #9d4edd)`,
                boxShadow: `0 0 28px -6px ${ACCENT}`,
              }}
            >
              Next question →
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="mt-1 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        <RotateCcw size={13} /> restart game
      </button>
    </div>
  );
}
