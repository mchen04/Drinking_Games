"use client";

/**
 * Tiny zero-asset sound engine built on the Web Audio API. Synthesises clicks,
 * dings, buzzes and "pour" sweeps on the fly so the app ships no audio files.
 * Respects a global mute flag persisted to localStorage.
 */

let ctx: AudioContext | null = null;
const MUTE_KEY = "pd:muted";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

type ToneOpts = {
  freq: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
  /** seconds to delay the note, scheduled on the audio clock (no setTimeout) */
  delay?: number;
};

function tone({ freq, duration = 0.12, type = "sine", gain = 0.18, sweepTo, delay = 0 }: ToneOpts) {
  const ac = getCtx();
  if (!ac || isMuted()) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  click: () => tone({ freq: 420, duration: 0.06, type: "triangle", gain: 0.1 }),
  tick: () => tone({ freq: 1200, duration: 0.03, type: "square", gain: 0.05 }),
  flip: () => tone({ freq: 600, duration: 0.1, type: "triangle", sweepTo: 900, gain: 0.12 }),
  ding: () => {
    tone({ freq: 880, duration: 0.18, type: "sine", gain: 0.16 });
    tone({ freq: 1320, duration: 0.22, type: "sine", gain: 0.1 });
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, type: "triangle", gain: 0.16, delay: i * 0.09 }),
    );
  },
  buzz: () => tone({ freq: 140, duration: 0.32, type: "sawtooth", gain: 0.16 }),
  pour: () => tone({ freq: 260, duration: 0.5, type: "sine", sweepTo: 520, gain: 0.12 }),
  whoosh: () => tone({ freq: 800, duration: 0.25, type: "sine", sweepTo: 200, gain: 0.1 }),
};
