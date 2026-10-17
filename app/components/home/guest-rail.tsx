'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { PlayerToken, tokenColor } from '@/app/components/player-token';
import type { Player } from '@shared/party-types';

const ARRIVAL_MS = 5000;

// Everyone in the house (see the design system's GuestRail): the host pinned
// on top, everyone else newest first, all the same size. A new guest's row
// opens and pushes the others down while it fades in, sits in a capsule with
// "is home" for five seconds, then the capsule fades away without the row
// changing height. Whoever is already here when the TV loads isn't an
// arrival, and a reconnect (same seat id) isn't one either.
export function GuestRail({ players }: { players: Player[] }) {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  // Seats that should play the opening animation when their row mounts.
  const entering = useRef(new Set<string>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(players.map((p) => p.id));
      return;
    }
    const arrived = players.filter((p) => !seen.current!.has(p.id));
    if (arrived.length === 0) return;
    for (const p of arrived) {
      seen.current.add(p.id);
      entering.current.add(p.id);
      timers.current.push(
        setTimeout(() => setFresh((f) => new Set([...f].filter((id) => id !== p.id))), ARRIVAL_MS),
      );
    }
    setFresh((f) => new Set([...f, ...arrived.map((p) => p.id)]));
  }, [players]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Fade the bottom only when there are more guests than fit.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const fit = () => setOverflow(el.scrollHeight > el.clientHeight + 2);
    fit();
    const t = setTimeout(fit, 700);
    return () => clearTimeout(t);
  }, [players]);

  const host = players.filter((p) => p.isHost);
  const rest = players.filter((p) => !p.isHost).reverse();
  const n = players.length;

  return (
    <div className="flex h-full flex-col">
      <p className="mb-6 ml-4 flex items-baseline gap-4 font-[family-name:var(--font-display)] text-[46px] leading-none font-semibold">
        {n === 0 ? (
          <span>No one home yet</span>
        ) : (
          <>
            <span className="text-[64px] leading-[0.8] font-extrabold text-[var(--home-brass)] italic [font-variant-numeric:oldstyle-nums]">
              {n}
            </span>
            <span>{n === 1 ? 'person' : 'people'} at home</span>
          </>
        )}
      </p>
      <div ref={list} className={`home-rail-list ${overflow ? 'home-rail-overflow' : ''}`}>
        {n === 0 && <p className="px-4 py-5 text-[34px] leading-snug text-[var(--home-text-muted)]">Waiting for someone to arrive…</p>}
        {[...host, ...rest].map((p) => (
          <GuestRow
            key={p.id}
            player={p}
            fresh={fresh.has(p.id)}
            enter={entering.current.has(p.id)}
            onEntered={() => entering.current.delete(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function GuestRow({
  player,
  fresh,
  enter,
  onEntered,
}: {
  player: Player;
  fresh: boolean;
  enter: boolean;
  onEntered: () => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [entering, setEntering] = useState(enter);

  // A new row grows open from zero height so the rows below glide down.
  useLayoutEffect(() => {
    const el = row.current;
    if (!enter || !el) return;
    onEntered();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setEntering(false);
    const h = el.offsetHeight;
    el.style.overflow = 'hidden';
    const anim = el.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px' }, { height: `${h}px` }], {
      duration: 550,
      easing: 'cubic-bezier(0.22, 0.7, 0.2, 1)',
    });
    anim.onfinish = () => (el.style.overflow = '');
    const t = setTimeout(() => setEntering(false), 1300);
    return () => clearTimeout(t);
    // only on mount
  }, []);

  return (
    <div
      ref={row}
      className={`home-row ${fresh ? 'home-row-fresh' : ''} ${entering ? 'home-row-enter' : ''} ${
        player.isHost ? 'mb-3.5' : ''
      } ${player.connected ? '' : 'opacity-40'}`}
      style={{ '--fresh': tokenColor(player.avatar) } as React.CSSProperties}
    >
      <PlayerToken avatar={player.avatar} host={player.isHost} className="h-[78px] w-[78px]" />
      <span className="flex min-w-0 items-baseline gap-4">
        <b className="truncate text-[40px] leading-[1.1] font-bold">{player.name}</b>
        {player.isHost && <span className="home-host shrink-0 text-[27px] opacity-55">host</span>}
        <span className="home-row-sub shrink-0 text-[30px] text-[var(--fresh)]">is home</span>
      </span>
      {!player.connected && <span className="ml-auto text-[27px] text-[var(--home-text-muted)]">away</span>}
    </div>
  );
}
