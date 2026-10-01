// Display-only — never imported by definition.ts, mirrors dice-glyphs.ts's
// separation of presentation from game logic.
export const rankLabel = (rank: number) =>
  rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
