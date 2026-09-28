import { faceNamePlural } from './dice-glyphs';
import type { Reveal } from './definition';

export const bidWasTrue = (reveal: Reveal) => reveal.loserId === reveal.challengerId;

// Shown while the board is building up, before the count is known.
export function claimSentence(reveal: Reveal, nameOf: (id: string) => string) {
  return `${nameOf(reveal.bidderId)} says there are at least ${reveal.bid.quantity} ${faceNamePlural(
    reveal.bid.face
  )}. ${nameOf(reveal.challengerId)} says it's a lie.`;
}

// Shown once the count finishes.
export function verdictSentence(reveal: Reveal, nameOf: (id: string) => string) {
  const wasTrue = bidWasTrue(reveal);
  return `There are ${reveal.actualCount} ${faceNamePlural(reveal.bid.face)}. ${nameOf(
    reveal.bidderId
  )}'s claim is ${wasTrue ? 'correct' : 'a lie'}. ${nameOf(reveal.loserId)} loses a die.`;
}
