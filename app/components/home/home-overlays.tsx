'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

import { PlayerToken } from '@/app/components/player-token';
import type { Player } from '@shared/party-types';

// Layers drawn on top of a game room's TV screen, for arrivals and late
// joins mid-game (at Home, the guest rail shows arrivals itself). Both are
// cosmetic, client-side only; the server just reports who's seated and
// whether the host asked for the join code.

const ARRIVAL_MS = 3200;

interface Arrival {
  id: string;
  name: string;
  avatar: string;
}

// "Sara is home": announces seats that weren't in the previous player list.
// Whoever's already there when the TV first loads isn't announced, and a
// reconnect (same seat id) isn't an arrival.
export function ArrivalToasts({ players }: { players: Player[] | undefined }) {
  const seen = useRef<Set<string> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);

  useEffect(() => {
    if (!players) return;
    if (!seen.current) {
      seen.current = new Set(players.map((p) => p.id));
      return;
    }
    const fresh = players.filter((p) => !seen.current!.has(p.id));
    if (fresh.length === 0) return;
    for (const p of fresh) {
      seen.current.add(p.id);
      timers.current.push(
        setTimeout(
          () => setArrivals((a) => a.filter((x) => x.id !== p.id)),
          ARRIVAL_MS
        )
      );
    }
    setArrivals((a) => [
      ...a,
      ...fresh.map(({ id, name, avatar }) => ({ id, name, avatar })),
    ]);
  }, [players]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (arrivals.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[clamp(0.75rem,4vh,2rem)] z-50 flex flex-col items-center gap-2">
      {arrivals.map((a) => (
        <div
          key={a.id}
          className="animate-arrival-toast flex items-center gap-3 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-6 py-2.5 font-serif text-[clamp(1rem,2.2vw,1.6rem)] text-[var(--home-text)] shadow-2xl"
          style={{ animationDuration: `${ARRIVAL_MS}ms` }}
        >
          <PlayerToken avatar={a.avatar} className="h-[1.6em] w-[1.6em]" />
          <span>
            <span className="font-bold text-[var(--home-magic)]">{a.name}</span>{' '}
            is home
          </span>
        </div>
      ))}
    </div>
  );
}

// "Let someone in": the host asked for the join code mid-game. A small card
// tucked in the top corner so it doesn't cover the game's own commentary,
// and the server drops it as soon as a new seat joins.
export function LateJoinOverlay({
  code,
  joinUrl,
}: {
  code: string;
  joinUrl: string;
}) {
  return (
    <div className="animate-fade-in fixed top-[clamp(0.75rem,2vh,1.5rem)] right-[clamp(0.75rem,2vw,1.5rem)] z-40 flex w-[clamp(9rem,15vw,12rem)] flex-col items-center gap-2 rounded-2xl border border-[var(--home-border)] bg-[var(--home-bg)] p-3 text-center text-[var(--home-text)] shadow-2xl">
      <p className="font-serif text-[clamp(0.85rem,1.4vw,1.05rem)] font-bold">
        Come on in!
      </p>
      <div className="rounded-lg bg-white p-1.5">
        <QRCodeSVG value={joinUrl} size={128} className="h-auto w-full" />
      </div>
      <p className="text-[clamp(0.6rem,0.9vw,0.7rem)] text-[var(--home-text-muted)]">
        gohomegames.com/join/
        <span className="block text-[clamp(0.9rem,1.5vw,1.15rem)] font-bold tracking-widest text-[var(--home-magic)]">
          {code}
        </span>
      </p>
      <p className="text-[clamp(0.55rem,0.85vw,0.7rem)] text-[var(--home-text-muted)]">
        You&apos;ll be dealt into the next game
      </p>
    </div>
  );
}
