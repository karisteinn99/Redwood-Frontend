import type { CSSProperties } from 'react';

import { SUITS, type Card, type Suit } from './definition';
import { rankLabel } from './rank-glyphs';

// The Dock deck, approved in the design system's PlayingCard. Each card is a
// pre-rendered SVG in public/cards/dock/ (`<rank>-<suit>.svg`, `back.svg`):
// the royals are too detailed to rebuild as components, and as images the
// browser caches each one once however often it's on screen.

const WIDTHS = {
  sm: 'clamp(1.75rem, 2.6vw, 2.6rem)',
  md: 'clamp(2.25rem, 5.5vh, 3.1rem)',
  lg: '5.25rem',
} as const;

type Size = keyof typeof WIDTHS;

const SUIT_NAMES: Record<Suit, string> = { spade: 'spades', heart: 'hearts', club: 'clubs', diamond: 'diamonds' };
const RANK_NAMES: Record<number, string> = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };

export const cardName = ({ rank, suit }: Card) => `${RANK_NAMES[rank] ?? rankLabel(rank)} of ${SUIT_NAMES[suit]}`;

const SHADOW = 'drop-shadow(0 3px 5px rgba(0,0,0,0.35))';
const SELECTED =
  'drop-shadow(0 0 1.5px var(--dock-coral)) drop-shadow(0 0 1.5px var(--dock-coral)) drop-shadow(0 0 12px var(--dock-coral-glow))';

// Card size, plus how far it tucks under the card before it in a fan
// (`overlap` is the hidden fraction of its width).
const box = (size: Size, overlap = 0): CSSProperties => ({
  width: WIDTHS[size],
  marginLeft: overlap ? `calc(${WIDTHS[size]} * ${-overlap})` : undefined,
});

export function CardFace({
  card,
  size = 'md',
  selected,
  overlap,
}: {
  card: Card;
  size?: Size;
  selected?: boolean;
  overlap?: number;
}) {
  return (
    <img
      src={`/cards/dock/${card.rank}-${card.suit}.svg`}
      alt={cardName(card)}
      draggable={false}
      className={`block aspect-[5/7] shrink-0 transition ${selected ? '-translate-y-2' : ''}`}
      style={{ ...box(size, overlap), filter: selected ? SELECTED : SHADOW }}
    />
  );
}

export function CardBack({
  size = 'md',
  overlap,
  className = '',
}: {
  size?: Size;
  overlap?: number;
  className?: string;
}) {
  return (
    <img
      src="/cards/dock/back.svg"
      alt=""
      draggable={false}
      className={`block aspect-[5/7] shrink-0 ${className}`}
      style={{ ...box(size, overlap), filter: SHADOW }}
    />
  );
}

// Cards overlapped so each one's corner index still shows.
export function CardFan({
  cards,
  size = 'md',
  selected,
}: {
  cards: Card[];
  size?: Size;
  selected?: boolean;
}) {
  return (
    <span className="flex items-end">
      {cards.map((card, i) => (
        <CardFace
          key={`${card.rank}-${card.suit}`}
          card={card}
          size={size}
          selected={selected}
          overlap={i === 0 ? 0 : 0.7}
        />
      ))}
    </span>
  );
}

// A completed book: all four suits of its rank.
export const bookCards = (rank: number): Card[] => SUITS.map((suit) => ({ rank, suit }));

// A hand seen from across the table: overlapping backs, squeezed tighter as
// the hand grows so a big hand doesn't stretch the seat.
export function FannedBacks({
  count,
  size = 'sm',
}: {
  count: number;
  size?: Size;
}) {
  if (count === 0)
    return (
      <span className="text-sm text-[var(--dock-text-muted)]">no cards</span>
    );
  const overlap = count > 10 ? 0.8 : count > 5 ? 0.72 : 0.6;
  return (
    <span className="flex items-end">
      {Array.from({ length: count }, (_, i) => (
        <CardBack key={i} size={size} overlap={i === 0 ? 0 : overlap} />
      ))}
    </span>
  );
}
