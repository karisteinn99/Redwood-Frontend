// Confetti that bursts out from the middle of whatever it sits in.
// `reach` is how far the pieces fly (any CSS length).
export function Burst({ colors, reach = '14vh', piece = '1.4vh', delay = 0 }: { colors: string[]; reach?: string; piece?: string; delay?: number }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className="animate-party-burst absolute -translate-x-1/2 rounded-[2px]"
          style={
            {
              width: `calc(${piece} / 2)`,
              height: piece,
              background: colors[i % colors.length],
              '--a': `${i * 18 + (i % 2) * 7}deg`,
              '--d': `calc(-1 * ${reach} * ${0.7 + (i % 3) * 0.18})`,
              animationDelay: `${delay + (i % 4) * 50}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

export const CONFETTI = ['#f6e2a8', '#dcb565', '#ffffff', '#ef6f5e', '#5fc3e4', '#7fc98f'];

// 1st, 2nd and 3rd get gold, silver and bronze.
export const placeColor = (place: number) =>
  place === 1 ? '#f0d48f' : place === 2 ? '#d6dbe8' : place === 3 ? '#d79a68' : 'var(--party-text-muted)';
