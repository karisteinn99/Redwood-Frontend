export const DICE_GLYPHS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export const faceGlyph = (face: number) => DICE_GLYPHS[face - 1] ?? '?';
export const faceLabel = (face: number) => (face === 1 ? 'Aces (wild)' : `${face}s`);

const PLURALS: Record<number, string> = {
  1: 'aces',
  2: 'twos',
  3: 'threes',
  4: 'fours',
  5: 'fives',
  6: 'sixes',
};
// Lowercase plural for narrative sentences, e.g. "there are 3 fives".
export const faceNamePlural = (face: number) => PLURALS[face] ?? `${face}s`;
