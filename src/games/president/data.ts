/** Rules text for the collapsible How-to-Play card. */
export const RULES_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Goal",
    body: "Be the first to shed all your cards. Play real cards in your hand alongside this app — the app just tracks roles between rounds.",
  },
  {
    heading: "Shedding cards",
    body: "The player to the left of the dealer leads any single card or set of equal cards. Each subsequent player must beat the previous play with a higher card (or set of the same size). Pass if you can't or don't want to play. The trick ends when everyone passes; the last player to play leads the next trick.",
  },
  {
    heading: "Finishing",
    body: "When you play your last card you're out — remember that position. First out = President 👑. Second out = Vice-President. Last remaining = Scum 💩. Second-last = Vice-Scum. Everyone in between is Neutral.",
  },
  {
    heading: "Next round rules",
    body: "Scum deals and collects cards. Scum must give their 2 best cards to the President; the President gives back any 2 cards they don't want. Vice-Scum gives 1 best card to Vice-President; Vice-President returns any 1 card.",
  },
  {
    heading: "Drinking rules",
    body: "Scum drinks whenever the President commands it — no arguments. Vice-Scum drinks when Vice-President commands. Neutral players are fair game for social dares. Anyone who forgets their role drinks 2.",
  },
];

/** Flavour commands the President can issue to Scum. */
export const PRESIDENT_COMMANDS: string[] = [
  "Scum — drink!",
  "Scum, take 2 sips for your insolence.",
  "Scum finishes their drink. Presidential decree.",
  "Scum drinks every time someone plays a 2 this trick.",
  "Scum must stand and bow before drinking.",
  "Scum takes a drink for every card in their hand over 5.",
  "Scum — pour me one first, then pour yourself one.",
  "Scum drinks twice. No reason needed, I'm the President.",
  "Scum and Vice-Scum both drink. Solidarity.",
  "Scum does a waterfall until I say stop.",
];
