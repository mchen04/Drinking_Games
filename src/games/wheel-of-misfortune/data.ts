import type { WheelSegment } from "@/components/ui";

export interface DareSegment extends WheelSegment {
  /** Short description shown in the result card. */
  detail: string;
  /** "drink" fires drinkRain; "safe" fires celebrate; "wild" fires win */
  kind: "drink" | "safe" | "wild";
}

export const DARE_SEGMENTS: DareSegment[] = [
  {
    label: "Take 2 Drinks",
    color: "#ff5e5b",
    detail: "Sip, sip — down two drinks right now. No negotiating.",
    kind: "drink",
  },
  {
    label: "Waterfall 🌊",
    color: "#18e7ff",
    detail:
      "Everyone starts drinking at once. You can't stop until the person to your left does. They can't stop until the person to THEIR left does. Go!",
    kind: "drink",
  },
  {
    label: "Give 3 Drinks",
    color: "#9d4edd",
    detail: "Hand out 3 drinks however you like — split them up or dump them all on one unlucky soul.",
    kind: "drink",
  },
  {
    label: "Truth or Dare",
    color: "#ff2d95",
    detail:
      "The group picks Truth or Dare for you. Refuse? Take a shot instead.",
    kind: "wild",
  },
  {
    label: "Make a Rule",
    color: "#2de2c0",
    detail:
      "You now get to invent one rule that lasts until the next spin. Anyone who breaks it drinks.",
    kind: "wild",
  },
  {
    label: "Take a SHOT 🥃",
    color: "#ffb627",
    detail: "No sipping allowed — pour a full shot and take it down.",
    kind: "drink",
  },
  {
    label: "Safe 😅",
    color: "#b6ff3c",
    detail: "Lucky you — sit this one out. No drinking required. This time.",
    kind: "safe",
  },
  {
    label: "Everyone Drinks",
    color: "#ff2d95",
    detail: "Every single person at the table takes a drink. Solidarity.",
    kind: "drink",
  },
];
