import type { Reveal } from './definition';

export interface RevealDie {
  face: number;
  matches: boolean;
  matchIndex: number | null; // this die's position in the overall counting order
}

export interface RevealGroup {
  playerId: string;
  dice: RevealDie[];
}

// Bidder and challenger first (the two people actually involved), then
// everyone else. Dice are numbered in this same order for the counting
// animation, so it reads as one continuous tally across the board.
export function revealGroups(reveal: Reveal): RevealGroup[] {
  const rest = Object.keys(reveal.allDice).filter(
    (id) => id !== reveal.bidderId && id !== reveal.challengerId
  );
  const order = [reveal.bidderId, reveal.challengerId, ...rest].filter((id) => reveal.allDice[id]);

  let matchIndex = 0;
  return order.map((playerId) => ({
    playerId,
    dice: reveal.allDice[playerId].map((face) => {
      const matches = face === reveal.bid.face || (reveal.bid.face !== 1 && face === 1);
      return { face, matches, matchIndex: matches ? matchIndex++ : null };
    }),
  }));
}
