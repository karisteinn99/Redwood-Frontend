import { rankLabel } from './rank-glyphs';

// Playing-card faces and backs for the Dock. Suits are never modeled (see
// definition.ts), so a face is just its rank plus a fish pip.

const SIZES = {
  sm: 'h-9 w-6 rounded text-[0.7rem]',
  md: 'h-[clamp(3.25rem,8vh,4.5rem)] w-[clamp(2.25rem,5.5vh,3.1rem)] rounded-md text-base',
  lg: 'h-24 w-16 rounded-lg text-2xl',
} as const;

type Size = keyof typeof SIZES;

export function CardFace({
  rank,
  size = 'md',
  selected,
}: {
  rank: number;
  size?: Size;
  selected?: boolean;
}) {
  // Face cards and aces in red, numbers in ink — a little variety without
  // implying suits.
  const red = rank === 1 || rank > 10;
  return (
    <span
      className={`relative flex shrink-0 flex-col items-center justify-center border font-bold shadow-md transition ${SIZES[size]} ${
        selected
          ? '-translate-y-2 border-[var(--dock-coral)]'
          : 'border-black/20'
      }`}
      style={{
        background: 'var(--dock-card)',
        color: red ? 'var(--dock-card-red)' : 'var(--dock-card-ink)',
        boxShadow: selected ? '0 0 16px var(--dock-coral-glow)' : undefined,
      }}
    >
      <span className="absolute top-0.5 left-1 text-[0.6em] leading-none">
        {rankLabel(rank)}
      </span>
      <span className="leading-none">{rankLabel(rank)}</span>
      {size !== 'sm' && (
        <span className="mt-0.5 text-[0.5em] leading-none opacity-70">🐟</span>
      )}
    </span>
  );
}

export function CardBack({
  size = 'md',
  className = '',
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`block shrink-0 border border-[var(--dock-card)]/70 shadow-md ${SIZES[size]} ${className}`}
      style={{
        background:
          'repeating-radial-gradient(circle at 50% 120%, var(--dock-water) 0px, var(--dock-water) 4px, var(--dock-border) 4px, var(--dock-border) 6px)',
      }}
    />
  );
}

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
  const overlap = count > 10 ? '-ml-4' : count > 5 ? '-ml-3.5' : '-ml-2.5';
  return (
    <span className="flex items-end">
      {Array.from({ length: count }, (_, i) => (
        <CardBack key={i} size={size} className={i === 0 ? '' : overlap} />
      ))}
    </span>
  );
}
