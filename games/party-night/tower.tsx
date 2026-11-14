import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

// The brass tower everyone climbs. Tokens are placed absolutely by step and
// slide on `top`, so a climb animates on its own whenever steps change.

const ROW = 5.2; // vh per step

export function FlagIcon({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5z" fill={filled ? 'currentColor' : 'none'} />
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
      <p className="mb-[1vh] flex items-center gap-[0.6vw] text-[2.6vh] font-bold text-[var(--home-gold)]">
        <FlagIcon className="h-[3.4vh] w-[3.4vh]" filled />
        Top
      </p>
      <div
        className="relative w-[26vw] rounded-[0.6vh] border-x-[0.5vh] border-[var(--home-brass)] bg-[color-mix(in_srgb,var(--home-surface)_70%,transparent)]"
        style={{ height: `${(goal + 1) * ROW}vh` }}
      >
        {rows.map((n, i) => (
          <div
            key={n}
            className="absolute inset-x-0 flex items-center border-b border-[var(--home-border)] px-[0.8vw] text-[1.8vh] text-[var(--home-text-muted)]"
            style={{ top: `${i * ROW}vh`, height: `${ROW}vh` }}
          >
            {n}
          </div>
        ))}
        <div
          className="absolute inset-x-0 flex items-center px-[0.8vw] text-[1.8vh] text-[var(--home-text-muted)]"
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
