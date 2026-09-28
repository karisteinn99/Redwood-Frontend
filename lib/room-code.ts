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

export const generateRoomCode = () =>
  `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${Math.floor(Math.random() * 10)}`;

export const normalizeRoomCode = (code: string) =>
  decodeURIComponent(code).toUpperCase();
