/**
 * Shared motion tokens. Keep easing curves canonical across the app so the
 * whole catalogue shares one "feel". Spring stiffness/damping stay inline per
 * component (intentionally tuned per game), but the expo ease-out curve — used
 * everywhere for entrances and reveals — lives here.
 */

/** Expressive ease-out (matches --ease-out-expo in globals.css). */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
