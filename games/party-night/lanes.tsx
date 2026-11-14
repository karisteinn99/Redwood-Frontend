import { useEffect, useState } from 'react';

import { PlayerToken, tokenColor } from '@/app/components/player-token';

import type { PartyView } from './definition';
import type { Person } from './people';

// Race lanes: one row of cells per player, the goal's worth long, with a
// brass line where the last sprint starts. Earlier points are the player's
// colour faded, this round's new points full colour with a white edge, lost
// points a dashed outline. The running total sits in the front cell.

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

// A small flat trophy for badges (no gradients, so it stays crisp tiny).
export function TrophyBadge({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} role="img" aria-label="trophy">
      <path d="M30 22 C10 22 8 52 34 60 M90 22 C110 22 112 52 86 60" fill="none" stroke="#dcb565" strokeWidth="9" strokeLinecap="round" />
      <path d="M26 12 H94 V30 C94 58 78 74 60 76 C42 74 26 58 26 30 Z" fill="#f0d48f" />
      <path d="M52 76 H68 L66 96 H54 Z M36 96 H84 V112 H36 Z" fill="#dcb565" />
      <rect x="28" y="112" width="64" height="22" rx="4" fill="#4a3523" />
    </svg>
  );
}

const EMPTY = '#20253f';
const STRIPES = `repeating-linear-gradient(135deg, #161a2e 0 5px, ${EMPTY} 5px 10px)`;

function cellStyle(n: number, color: string, points: number, change: number, zone: boolean): React.CSSProperties {
  const before = points - change;
  if (change > 0 && n > before && n <= points)
    return { background: color, border: '2px solid #fff', boxShadow: '0 0 12px rgba(255,255,255,0.35)' };
  if (n <= Math.min(points, before)) return { background: `${color}99` };
  const empty = { background: zone ? STRIPES : EMPTY };
  if (change < 0 && n > points && n <= before) return { ...empty, border: `2px dashed ${color}` };
  return empty;
}

// Just the cells, for the TV and for a phone's own lane.
export function LaneCells({
  color,
  points,
  change,
  goal,
  line,
  sprint,
  height,
  font,
}: {
  color: string;
  points: number;
  change: number;
  goal: number;
  line: number;
  sprint: boolean;
  height: string;
  font: string;
}) {
  const cells = (from: number, to: number) => (
    <div className="grid gap-[3px]" style={{ flex: `${to - from} 1 0`, gridTemplateColumns: `repeat(${to - from}, minmax(0, 1fr))`, height }}>
      {Array.from({ length: to - from }, (_, i) => {
        const n = from + i + 1;
        return (
          <div
            key={n}
            className="flex items-center justify-center rounded-[22%] font-bold text-[#141726] transition-all duration-700"
            style={{ ...cellStyle(n, color, points, change, sprint && n > line), fontSize: font }}
          >
            {n === points ? points : ''}
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="flex flex-1 items-center gap-[6px]">
      {cells(0, line)}
      <div className="w-[4px] self-stretch rounded-full bg-[#b8955a]" />
      {cells(line, goal)}
    </div>
  );
}

export function Lanes({
  view,
  who,
  changes = {},
  details = {},
}: {
  view: PartyView;
  who: (id: string) => Person;
  changes?: Record<string, number>;
  details?: Record<string, string>;
}) {
  const { goal, line, sprint } = view.settings;
  // Start from before this round, then let the new points fill in.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 700);
    return () => clearTimeout(t);
  }, []);
  const rowH = Math.min(9, 66 / view.order.length);
  return (
    <div className="flex w-full flex-col" style={{ gap: `${rowH * 0.2}vh` }}>
      {view.order.map((id) => {
        const p = who(id);
        const change = settled ? (changes[id] ?? 0) : 0;
        const points = (view.points[id] ?? 0) - (settled ? 0 : (changes[id] ?? 0));
        const trophies = view.trophies[id] ?? 0;
        return (
          <div key={id} className="flex items-center gap-[1vw]" style={{ height: `${rowH}vh` }}>
            <span className="relative">
              <PlayerToken avatar={p.avatar} className="h-[6vh] w-[6vh]" />
              {trophies > 0 && (
                <span className="absolute -top-[1.4vh] -right-[1.2vh] flex">
                  {Array.from({ length: trophies }, (_, i) => (
                    <TrophyBadge key={i} className="-ml-[0.8vh] h-[3.2vh] w-[2.8vh] drop-shadow-[0_0.3vh_0.4vh_rgba(0,0,0,0.6)]" />
                  ))}
                </span>
              )}
            </span>
            <span className="w-[11vw] leading-tight">
              <span className="block truncate text-[2.8vh] font-semibold">{p.name}</span>
              {details[id] && <span className="block truncate text-[1.9vh] text-[var(--party-text-muted)]">{details[id]}</span>}
            </span>
            <div
              className="flex flex-1 rounded-[1.2vh] p-[0.6vh] transition-shadow duration-700"
              style={{ boxShadow: trophies > 0 ? '0 0 0 2px #dcb565, 0 0 18px rgba(220,181,101,0.45)' : 'none' }}
            >
              <LaneCells
                color={tokenColor(p.avatar)}
                points={points}
                change={change}
                goal={goal}
                line={line}
                sprint={sprint}
                height="3.6vh"
                font="2vh"
              />
            </div>
            <span
              className="w-[4.5vw] text-right text-[3vh] font-bold"
              style={{ color: change < 0 ? '#ff9f8a' : 'var(--home-gold)' }}
            >
              {change > 0 ? `+${change}` : change < 0 ? `−${-change}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
