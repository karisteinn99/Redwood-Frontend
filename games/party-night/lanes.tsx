import { useEffect, useId, useState } from 'react';

import { PlayerToken, tokenColor } from '@/app/components/player-token';

import type { PartyView } from './definition';
import type { Person } from './people';

// Race lanes: one row of cells per player, the goal's worth long, with a
// brass line where the last sprint starts. Earlier points are the player's
// colour faded, this round's new points full colour with a white edge, lost
// points a dashed outline. The running total sits in the front cell.

// The prize: a pickle. Drawn once; `id` keeps gradient ids unique per copy.
function PickleShape({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9cbf4a" />
          <stop offset="0.5" stopColor="#5f8424" />
          <stop offset="1" stopColor="#2f4a12" />
        </linearGradient>
      </defs>
      <path
        d="M38 206 C36 196 46 190 58 190 C80 190 104 182 122 170 C134 162 146 166 146 178 C146 192 128 206 104 214 C82 221 50 222 42 216 C39 213 38 210 38 206Z"
        fill={`url(#${id})`}
        stroke="#2a4010"
        strokeWidth="1.8"
      />
      <path d="M48 198 C70 196 100 188 124 174" fill="none" stroke="#c9e07a" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      {BUMPS.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <ellipse cx={x} cy={y + 1} rx="2.2" ry="1.76" fill="#2a4010" opacity="0.55" />
          <ellipse cx={x} cy={y} rx="1.98" ry="1.54" fill="#b7d665" />
        </g>
      ))}
      <path d="M146 176 q6 -3 8 1" fill="none" stroke="#4a3a1c" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}
const BUMPS = [[54, 205], [66, 200], [78, 206], [90, 198], [102, 204], [112, 194], [124, 188], [134, 182], [70, 212], [96, 212], [118, 202], [140, 176]];

export function Pickle({ className = '' }: { className?: string }) {
  const id = `pk${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="34 160 124 64" className={className} role="img" aria-label="the pickle">
      <PickleShape id={id} />
    </svg>
  );
}

// Small pickle for badges: tilted so it fits beside a token.
export function PickleBadge({ className = '' }: { className?: string }) {
  const id = `pb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="34 130 124 124" className={className} role="img" aria-label="pickle">
      <g transform="rotate(-35 96 192)">
        <PickleShape id={id} />
      </g>
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
                    <PickleBadge key={i} className="-ml-[0.8vh] h-[3.6vh] w-[3.6vh] drop-shadow-[0_0.3vh_0.4vh_rgba(0,0,0,0.6)]" />
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
