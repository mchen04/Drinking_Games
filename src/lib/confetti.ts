"use client";

import confetti from "canvas-confetti";

const NEON = ["#ff2d95", "#18e7ff", "#b6ff3c", "#ffb627", "#9d4edd", "#2de2c0"];

/** Celebratory burst from both lower corners in the neon palette. */
export function celebrate() {
  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors: NEON, scalar: 1.1 });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors: NEON, scalar: 1.1 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Single pop at a point (defaults to center). */
export function pop(x = 0.5, y = 0.5) {
  confetti({
    particleCount: 90,
    spread: 110,
    startVelocity: 38,
    origin: { x, y },
    colors: NEON,
    scalar: 1.05,
  });
}

/** Rain of emoji-ish drips for "drink!" moments. */
export function drinkRain() {
  confetti({
    particleCount: 60,
    spread: 100,
    origin: { y: -0.1 },
    gravity: 1.4,
    colors: ["#ffb627", "#ff2d95", "#18e7ff"],
    shapes: ["circle"],
    scalar: 1.2,
  });
}
