import { useEffect, useRef, useState } from 'react';

import { AVATARS } from '@shared/avatars';
import type { Player } from '@shared/party-types';

import type { PartyView } from './definition';

export interface Person {
  name: string;
  avatar: string;
  bot: boolean;
}

// Name and token for everyone in the night, bots included. Bots take the
// tokens nobody in the room is using, in the usual fallback order.
export function usePeople(view: PartyView, players: Player[]) {
  const taken = new Set(players.map((p) => p.avatar));
  const free = AVATARS.filter((a) => !taken.has(a));
  const map: Record<string, Person> = {};
  for (const p of players) map[p.id] = { name: p.name, avatar: p.avatar, bot: false };
  view.bots.forEach((b, i) => (map[b.id] = { name: b.name, avatar: free[i % Math.max(1, free.length)] ?? '', bot: true }));
  return (id: string): Person => map[id] ?? { name: '?', avatar: '', bot: false };
}

// The humans still in the room (not bots, not people who left).
export const humanIds = (view: PartyView) =>
  view.order.filter((id) => !view.bots.some((b) => b.id === id) && !(view.gone ?? []).includes(id));

// Holds the last reveal on screen for a moment before the next question.
export function useHeldReveal(id: number | null, ms = 2600) {
  const [held, setHeld] = useState<number | null>(null);
  const seen = useRef<number | null>(id);
  useEffect(() => {
    if (id === null || id === seen.current) return;
    seen.current = id;
    setHeld(id);
    const t = setTimeout(() => setHeld(null), ms);
    return () => clearTimeout(t);
  }, [id, ms]);
  return held !== null;
}
