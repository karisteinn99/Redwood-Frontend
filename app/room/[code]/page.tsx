'use client';

import { createRef, use, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

import { normalizeRoomCode } from '@/lib/room-code';
import { usePartyRoom } from '@/lib/use-party-room';
import type { HelloMessage } from '@shared/party-types';
import { GAME_UI } from '@/games/ui';
import { ROOM_DOORS } from '@/games/rooms';
import { HomeTv } from '@/app/components/home/home-tv';

const TV_HELLO: HelloMessage = { type: 'hello', role: 'tv' };

// How long the door-portal transition plays before the actual game takes
// over — client-side pacing only, matches the reveal-stage pattern used
// inside Liar's Dice (no server timer involved).
const PORTAL_MS = 1150;

export default function TvPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeRoomCode(use(params).code);
  const { state, gameView } = usePartyRoom(code, TV_HELLO);
  const [origin, setOrigin] = useState('');
  // Stable across renders (lazy initializer runs once); one ref per door.
  const doorRefs = useRef<Record<string, RefObject<HTMLDivElement | null>>>(
    Object.fromEntries(ROOM_DOORS.map((d) => [d.gameId, createRef<HTMLDivElement>()])),
  ).current;
  const doorPos = useRef<Record<string, { x: number; y: number }>>({});
  const wasLobby = useRef(true);

  const [portal, setPortal] = useState<{ x: number; y: number } | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);

  useEffect(() => {
    const { hostname, port, protocol, origin: here } = window.location;
    setOrigin(here);
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return;
    fetch('/api/lan')
      .then((r) => r.json())
      .then(({ ip }) => ip && setOrigin(`${protocol}//${ip}${port ? `:${port}` : ''}`))
      .catch(() => {});
  }, []);

  // Keep every door's last known screen position fresh while it's on
  // screen, so it's still available the instant a game starts and Home
  // unmounts.
  useLayoutEffect(() => {
    if (state?.phase === 'playing') return;
    for (const [gameId, ref] of Object.entries(doorRefs)) {
      if (!ref.current) continue;
      const rect = ref.current.getBoundingClientRect();
      doorPos.current[gameId] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  });

  // A room's door glows in the lobby; when the host starts that game, play
  // a portal-open transition growing from that door instead of a hard cut.
  useEffect(() => {
    const gameId = state?.gameId;
    const startingRoom = wasLobby.current && state?.phase === 'playing' && !!gameId && gameId in doorRefs;
    wasLobby.current = state?.phase !== 'playing';
    if (!startingRoom || !gameId) return;

    const pos = doorPos.current[gameId] ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setPortal(pos);
    setPortalOpen(false);
    const raf = requestAnimationFrame(() => setPortalOpen(true));
    const t = setTimeout(() => {
      setPortal(null);
      setPortalOpen(false);
    }, PORTAL_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [state?.phase, state?.gameId]);

  const joinUrl = `${origin}/join/${code}`;
  const players = state?.players ?? [];

  // Mid-transition: Home stays as the base layer, the game grows into view
  // from the door through an expanding clip-path.
  if (portal) {
    const Tv = state?.gameId ? GAME_UI[state.gameId]?.Tv : undefined;
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <HomeTv code={code} joinUrl={joinUrl} players={players} doorRefs={doorRefs} />
        <div
          className="absolute inset-0 text-white transition-[clip-path] duration-[1150ms] ease-[cubic-bezier(0.22,0.7,0.2,1)]"
          style={{ clipPath: `circle(${portalOpen ? '150%' : '0px'} at ${portal.x}px ${portal.y}px)` }}
        >
          <div className="flex h-full items-center justify-center">
            {Tv && gameView && <Tv view={gameView.view} players={players} />}
          </div>
        </div>
      </div>
    );
  }

  if (state?.phase === 'playing' && state.gameId) {
    const Tv = GAME_UI[state.gameId]?.Tv;
    return (
      <div className="flex h-screen w-screen items-center justify-center text-white">
        {Tv && gameView ? (
          <Tv view={gameView.view} players={players} />
        ) : (
          <p className="text-2xl">Loading…</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <HomeTv code={code} joinUrl={joinUrl} players={players} doorRefs={doorRefs} />
    </div>
  );
}
