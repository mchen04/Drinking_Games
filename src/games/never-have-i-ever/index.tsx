"use client";

import { useState } from "react";
import { PromptDeck } from "@/components/ui";
import { cn } from "@/lib/cn";

const MILD = [
  "been on a blind date.",
  "fallen asleep in a public place.",
  "sung karaoke sober.",
  "broken a bone.",
  "cried during a Disney movie.",
  "eaten food off the floor.",
  "stalked an ex on social media.",
  "pretended to be sick to skip work.",
  "lied about my age.",
  "gone a whole day without my phone.",
  "re-gifted a present.",
  "talked my way out of a ticket.",
  "danced in the rain.",
  "forgotten someone's name mid-conversation.",
  "had a crush on a teacher.",
  "binge-watched a whole season in one day.",
  "laughed so hard I cried.",
  "tripped in public and played it cool.",
  "googled myself.",
  "won money gambling.",
];

const SPICY = [
  "sent a text to the wrong person.",
  "kissed someone in this room.",
  "had a one-night stand.",
  "skinny dipped.",
  "made out with a stranger.",
  "been caught cheating on a test.",
  "snuck someone into my place.",
  "had a friends-with-benefits.",
  "ghosted someone.",
  "had a crush on a friend's partner.",
  "lied to get out of a date.",
  "sent a risky text I regretted.",
  "kissed someone whose name I forgot.",
  "been kicked out of a bar.",
  "dated two people at once.",
  "faked liking a gift to someone's face.",
  "stolen something small.",
  "crashed a party I wasn't invited to.",
];

const EXTRA = [
  "hooked up with someone at a wedding.",
  "done a body shot.",
  "had a hangover so bad I swore off drinking.",
  "blacked out and pieced the night back together.",
  "woken up somewhere and not known how I got there.",
  "kissed more than one person in a night.",
  "been the reason a party got shut down.",
  "sent a 3am 'you up?' text.",
  "regretted a tattoo or piercing.",
  "had a secret I've never told anyone here.",
  "done something illegal and gotten away with it.",
  "hooked up with an ex after swearing I wouldn't.",
];

const LEVELS = [
  { id: "mild", label: "Mild", items: MILD, accent: "#2de2c0" },
  { id: "spicy", label: "Spicy", items: SPICY, accent: "#ffb627" },
  { id: "extra", label: "Extra 🔥", items: EXTRA, accent: "#ff2d95" },
] as const;

export default function NeverHaveIEver() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(LEVELS[0]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-center text-white/55 max-w-md mb-6">
        Read the card aloud. <span className="text-white">If you&apos;ve done it, take a drink.</span> Last
        one with secrets intact wins (and is probably lying).
      </p>

      <div className="flex gap-2 mb-8 glass rounded-full p-1">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
              level.id === l.id ? "text-ink" : "text-white/60 hover:text-white",
            )}
            style={level.id === l.id ? { background: l.accent } : undefined}
          >
            {l.label}
          </button>
        ))}
      </div>

      <PromptDeck
        key={level.id}
        items={level.items}
        prefix="Never have I ever…"
        accent={level.accent}
        nextLabel="Next confession"
      />
    </div>
  );
}
