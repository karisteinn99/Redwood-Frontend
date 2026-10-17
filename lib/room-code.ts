const WORDS = [
  'JOLLY',
  'LUCKY',
  'COSY',
  'MERRY',
  'SNUG',
  'PLUSH',
  'BRAVE',
  'SUNNY',
  'WITTY',
  'NIMBLE',
  'MELLOW',
  'DAPPER',
];

// 12 words × 100 numbers = 1,200 combinations. Not huge on its own, but
// paired with the active occupancy check in app/page.tsx (which retries on
// collision) rather than relying on this space alone to avoid one.
// A word and a number with no separator (`JOLLY42`): the number reads apart
// by colour on the TV, so there's no hyphen to say out loud or mistype.
export const generateRoomCode = () =>
  `${WORDS[Math.floor(Math.random() * WORDS.length)]}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

// Accepts old-style and hand-typed input too (`jolly-42`, `Jolly 42`).
export const normalizeRoomCode = (code: string) =>
  decodeURIComponent(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
