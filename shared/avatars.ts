// Player tokens: odd household objects (see the design system's PlayerToken).
// Pure data, shared by the Worker (validation/dedup) and the client (picker).
// Order is the fallback order when a pick is taken. The drawings live in
// app/components/player-token.tsx.
export const AVATARS = [
  'kettle',
  'alarm-clock',
  'slipper',
  'rubber-duck',
  'watering-can',
  'desk-lamp',
  'toaster',
  'armchair',
] as const;

export type Avatar = (typeof AVATARS)[number];

export const AVATAR_NAMES: Record<Avatar, string> = {
  kettle: 'the kettle',
  'alarm-clock': 'the alarm clock',
  slipper: 'the slipper',
  'rubber-duck': 'the rubber duck',
  'watering-can': 'the watering can',
  'desk-lamp': 'the desk lamp',
  toaster: 'the toaster',
  armchair: 'the armchair',
};

export const isAvatar = (value: unknown): value is Avatar =>
  typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
