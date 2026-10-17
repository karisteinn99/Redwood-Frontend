'use client';

import { useId } from 'react';

import { AVATAR_NAMES, isAvatar, type Avatar } from '@shared/avatars';

// A player's token: an odd household object in pewter on a dark disc, ringed
// in the player's colour with poker-chip notches. Drawings are on a 64-unit
// grid; INK marks the figure's own strokes and CUT the details cut into it.
const TOKENS: Record<Avatar, { color: string; d: string }> = {
  'kettle': {
    color: '#f2c14e',
    d: '<path d="M16 52 Q13 33 22 26 H42 Q51 33 48 52 Z"/><rect x="25" y="19" width="14" height="7" rx="2"/><circle cx="32" cy="15.5" r="3.2"/><path d="M17 38 L7 29 L10 26 L19 33 Z"/><path d="M22 27 Q32 7 42 27" fill="none" stroke="INK" stroke-width="4.5" stroke-linecap="round"/>',
  },
  'alarm-clock': {
    color: '#b9a6f5',
    d: '<circle cx="17" cy="17" r="6.5"/><circle cx="47" cy="17" r="6.5"/><circle cx="32" cy="35" r="17"/><path d="M21 49 L16 57 M43 49 L48 57" stroke="INK" stroke-width="4" stroke-linecap="round"/><path d="M32 35 V25 M32 35 L39 39" stroke="CUT" stroke-width="3" stroke-linecap="round"/>',
  },
  'slipper': {
    color: '#7fc98f',
    d: '<path d="M5 45 q0-8 10-9.5 l15-2 q10-10 22-6.5 q9 3 9 12.5 v6 q0 6 -8 6 H12 q-7 0 -7 -6.5 Z"/><path d="M27 33.5 q8 -3 14 4" fill="none" stroke="CUT" stroke-width="2.4" opacity="0.6"/>',
  },
  'rubber-duck': {
    color: '#5fc3e4',
    d: '<ellipse cx="29" cy="42" rx="21" ry="12.5"/><circle cx="40" cy="24" r="10.5"/><path d="M49 23 L60 27 L49 31 Z"/><path d="M8 37 L16 33 L18 43 Z"/><circle cx="42.5" cy="21.5" r="1.9" fill="CUT"/>',
  },
  'watering-can': {
    color: '#e8a87c',
    d: '<path d="M13 27 h26 v23 q0 4 -4 4 h-18 q-4 0 -4 -4 Z"/><path d="M39 35 L54 21 L57 24 L42 41 Z"/><rect x="51" y="14" width="10" height="6" rx="2" transform="rotate(-42 56 17)"/><path d="M17 27 Q26 10 35 27" fill="none" stroke="INK" stroke-width="4.5" stroke-linecap="round"/>',
  },
  'desk-lamp': {
    color: '#ef6f5e',
    d: '<ellipse cx="20" cy="54" rx="13" ry="3.8"/><path d="M19 52 L28 32 L43 22" fill="none" stroke="INK" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="32" r="3.4"/><path d="M38 12 L57 24 L47 35 Z"/>',
  },
  'toaster': {
    color: '#f4f0e6',
    d: '<rect x="18" y="13" width="10" height="16" rx="3"/><rect x="35" y="16" width="10" height="13" rx="3"/><rect x="9" y="26" width="46" height="26" rx="9"/><rect x="55" y="34" width="5" height="5" rx="1.5"/><rect x="14" y="52" width="6" height="4" rx="1"/><rect x="44" y="52" width="6" height="4" rx="1"/>',
  },
  'armchair': {
    color: '#c58ce0',
    d: '<path d="M18 31 V18 q0-6 6-6 h16 q6 0 6 6 V31 Z"/><path d="M7 28 q0-4 4-4 h5 q4 0 4 4 v7 h24 v-7 q0-4 4-4 h5 q4 0 4 4 v19 H7 Z"/><rect x="10" y="47" width="5" height="8" rx="1.5"/><rect x="49" y="47" width="5" height="8" rx="1.5"/>',
  },
  'teacup': {
    color: '#f29bb5',
    d: '<path d="M10 26 h36 v7 q0 17 -18 17 q-18 0 -18 -17 Z"/><path d="M45 30 q11 0 11 8 q0 8 -12 8" fill="none" stroke="INK" stroke-width="4.5"/><ellipse cx="28" cy="53" rx="23" ry="4.5"/><path d="M20 20 q-3 -5 0 -9 M29 20 q-3 -5 0 -9 M38 20 q-3 -5 0 -9" fill="none" stroke="INK" stroke-width="3" stroke-linecap="round"/>',
  },
  'houseplant': {
    color: '#4fbfa8',
    d: '<path d="M20 40 h24 l-3.5 15 h-17 Z"/><path d="M32 40 V22" stroke="INK" stroke-width="3"/><ellipse cx="22" cy="26" rx="10" ry="5" transform="rotate(-28 22 26)"/><ellipse cx="42" cy="22" rx="10" ry="5" transform="rotate(28 42 22)"/><ellipse cx="32" cy="12" rx="5" ry="9"/>',
  },
  'umbrella': {
    color: '#c98a4b',
    d: '<path d="M7 31 q25 -28 50 0 q-6 -5 -12.5 0 q-6 -5 -12.5 0 q-6 -5 -12.5 0 q-6 -5 -12.5 0 Z"/><path d="M32 30 V49 q0 7 -7 7 q-5 0 -5 -5" fill="none" stroke="INK" stroke-width="4" stroke-linecap="round"/><rect x="30.5" y="5" width="3" height="5" rx="1"/>',
  },
  'skeleton-key': {
    color: '#7f9be6',
    d: '<circle cx="15" cy="32" r="10" fill="none" stroke="INK" stroke-width="5"/><rect x="24" y="29.5" width="34" height="5" rx="2"/><rect x="47" y="34" width="4" height="9" rx="1"/><rect x="53" y="34" width="4" height="6" rx="1"/><circle cx="15" cy="32" r="3"/>',
  },
};

export const tokenColor = (avatar: string) => (isAvatar(avatar) ? TOKENS[avatar].color : '#a99d84');

export function PlayerToken({
  avatar,
  host = false,
  className = 'h-12 w-12',
}: {
  avatar: string;
  host?: boolean;
  className?: string;
}) {
  const id = `tok${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const token = isAvatar(avatar) ? TOKENS[avatar] : null;
  const ink = `url(#${id}-pewter)`;
  const cut = '#1d1915';
  const label = (isAvatar(avatar) ? AVATAR_NAMES[avatar] : 'a guest') + (host ? ', host' : '');
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label} className={`shrink-0 overflow-visible ${className}`}>
      <defs>
        <linearGradient id={`${id}-pewter`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#f6f2ea" />
          <stop offset="0.55" stopColor="#d2ccbf" />
          <stop offset="1" stopColor="#9e978a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={token?.color ?? '#a99d84'} />
      {Array.from({ length: 8 }, (_, n) => (
        <rect
          key={n}
          x="45.5"
          y="2"
          width="9"
          height="11"
          rx="2"
          fill={cut}
          opacity="0.32"
          transform={`rotate(${n * 45 + 22.5} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="39" fill={cut} />
      <circle cx="50" cy="50" r="39" fill="none" stroke={token?.color ?? '#a99d84'} strokeWidth="1.6" opacity="0.7" />
      {token && (
        <g
          transform="translate(22 22) scale(0.875)"
          fill={ink}
          dangerouslySetInnerHTML={{ __html: token.d.split('INK').join(ink).split('CUT').join(cut) }}
        />
      )}
      {host && (
        <g transform="translate(70 70)">
          <circle r="15" fill="#c9a35c" stroke={cut} strokeWidth="3" />
          <circle cx="-4" cy="0" r="4.2" fill="none" stroke="#241a0e" strokeWidth="2.6" />
          <path d="M0 0 H8 M5 0 V4 M8 0 V3" stroke="#241a0e" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
