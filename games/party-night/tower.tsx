import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

// The brass tower everyone climbs. Tokens are placed absolutely by step and
// slide on `top`, so a climb animates on its own whenever steps change.

const ROW = 5; // vh per step

export function FlagIcon({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5z" fill={filled ? 'currentColor' : 'none'} />
    </svg>
  );
}

// The prize at the top of the tower: a polished brass cup on a plinth.
export function Trophy({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pn-gold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8a6328" />
          <stop offset="0.28" stopColor="#f6e2a8" />
          <stop offset="0.5" stopColor="#dcb565" />
          <stop offset="0.78" stopColor="#a87a34" />
          <stop offset="1" stopColor="#6e4c1c" />
        </linearGradient>
        <linearGradient id="pn-plinth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a3523" />
          <stop offset="1" stopColor="#24180e" />
        </linearGradient>
      </defs>
      <path d="M30 22 C10 22 8 52 34 60" fill="none" stroke="url(#pn-gold)" strokeWidth="7" strokeLinecap="round" />
      <path d="M90 22 C110 22 112 52 86 60" fill="none" stroke="url(#pn-gold)" strokeWidth="7" strokeLinecap="round" />
      <path d="M26 12 H94 V30 C94 58 78 74 60 76 C42 74 26 58 26 30 Z" fill="url(#pn-gold)" />
      <ellipse cx="60" cy="12" rx="34" ry="5" fill="#f9ecc4" />
      <ellipse cx="60" cy="12" rx="29" ry="3" fill="#a87a34" />
      <path d="M38 20 C38 44 44 60 54 68" fill="none" stroke="#fff6dc" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M54 76 H66 L64 92 H56 Z" fill="url(#pn-gold)" />
      <path d="M40 92 H80 L84 102 H36 Z" fill="url(#pn-gold)" />
      <rect x="30" y="102" width="60" height="30" rx="4" fill="url(#pn-plinth)" />
      <rect x="38" y="110" width="44" height="12" rx="2" fill="url(#pn-gold)" opacity="0.85" />
      <path d="M60 30 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.2 -7 9.9 -1.4 z" fill="#fff4d4" opacity="0.9" />
    </svg>
  );
}

export function Tower({
  order,
  steps,
  goal,
  players,
  gains = {},
}: {
  order: string[];
  steps: Record<string, number>;
  goal: number;
  players: Player[];
  gains?: Record<string, number>;
}) {
  const player = (id: string) => players.find((p) => p.id === id);
  const rows = Array.from({ length: goal }, (_, i) => goal - i);
  return (
    <div className="flex flex-col items-center">
      <div className="relative -mb-[0.6vh]">
        <div className="absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,rgba(246,226,168,0.35),transparent_65%)]" />
        <Trophy className="relative h-[12vh] w-[10vh] drop-shadow-[0_1vh_1.6vh_rgba(0,0,0,0.6)]" />
      </div>
      <div
        className="relative w-[26vw] rounded-[0.6vh] border-x-[0.5vh] border-[var(--home-brass)] bg-[color-mix(in_srgb,var(--party-surface)_70%,transparent)]"
        style={{ height: `${(goal + 1) * ROW}vh` }}
      >
        {rows.map((n, i) => (
          <div
            key={n}
            className="absolute inset-x-0 flex items-center border-b border-[var(--party-border)] px-[0.8vw] text-[1.8vh] text-[var(--party-text-muted)]"
            style={{ top: `${i * ROW}vh`, height: `${ROW}vh` }}
          >
            {n}
          </div>
        ))}
        <div
          className="absolute inset-x-0 flex items-center px-[0.8vw] text-[1.8vh] text-[var(--party-text-muted)]"
          style={{ top: `${goal * ROW}vh`, height: `${ROW}vh` }}
        >
          Start
        </div>
        {order.map((id) => {
          const step = steps[id] ?? 0;
          const sameStep = order.filter((o) => (steps[o] ?? 0) === step);
          const slot = sameStep.indexOf(id);
          const gain = gains[id] ?? 0;
          return (
            <div
              key={id}
              className="absolute flex items-center gap-[0.3vw] transition-[top,left] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ top: `${(goal - step) * ROW + ROW * 0.1}vh`, left: `calc(3.2vw + ${slot * 4.6}vh)` }}
            >
              <PlayerToken
                avatar={player(id)?.avatar ?? ''}
                className="h-[4.2vh] w-[4.2vh] drop-shadow-[0_0.4vh_0.8vh_rgba(0,0,0,0.6)]"
              />
              {gain > 0 && (
                <span className="absolute -top-[1.2vh] -right-[1vh] rounded-full bg-[var(--home-gold)] px-[0.5vh] text-[1.6vh] leading-[2.2vh] font-bold text-[#211d18]">
                  +{gain}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
