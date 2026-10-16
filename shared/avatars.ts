// Player characters. Pure data, shared by the Worker (validation/dedup) and
// the client (picker). Order is the fallback order when a pick is taken.
export const AVATARS = [
  '🦊',
  '🐻',
  '🐸',
  '🦉',
  '🐙',
  '🐱',
  '🐰',
  '🐢',
  '🦔',
  '🐧',
  '🦁',
  '🐼',
] as const;

export const isAvatar = (value: unknown): value is string =>
  typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
