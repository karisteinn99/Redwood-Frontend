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
export const generateRoomCode = () =>
  `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

export const normalizeRoomCode = (code: string) =>
  decodeURIComponent(code).toUpperCase();
