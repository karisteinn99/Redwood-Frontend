import { useId } from 'react';

import { ROOM_DOORS } from '@/games/rooms';
import { GAME_UI } from '@/games/ui';
import { playersLine } from '@/lib/players-line';
import type { GameInfo } from '@shared/game';
import type { Player } from '@shared/party-types';

import { PANES } from './home-windows';

// The phone's side of picking a game at Home: the host sees the games as a
// list, opens one onto its own page (who's in, the player range, Start), and
// every guest sees that same game as "Up next" with its rules.

function GamePainting({ gameId, className = '' }: { gameId: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const pane = ROOM_DOORS.find((d) => d.gameId === gameId)?.pane;
  if (!pane) return <div className={`bg-[var(--home-surface)] ${className}`} />;
  return (
    <svg
      viewBox="0 0 176 260"
      preserveAspectRatio="xMidYMid slice"
      className={`block border-2 border-[var(--home-brass)] ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PANES[pane].body.replace(/PID/g, id) }}
    />
  );
}

const range = (g: GameInfo) =>
  g.minPlayers === g.maxPlayers ? `${g.minPlayers} players` : `${g.minPlayers}–${g.maxPlayers} players`;

function GameTitle({ gameId, name }: { gameId: string; name: string }) {
  const title = ROOM_DOORS.find((d) => d.gameId === gameId)?.title;
  return (
    <p
      className="font-[family-name:var(--font-display)] text-4xl font-bold"
      style={
        title
          ? {
              background: `linear-gradient(180deg, ${title[0]}, ${title[1]} 50%, ${title[2]})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }
          : undefined
      }
    >
      {name}
    </p>
  );
}

export function GameList({
  games,
  title,
  upNextId = null,
  onOpen,
}: {
  games: GameInfo[];
  title: string;
  upNextId?: string | null;
  onOpen: (gameId: string) => void;
}) {
  return (
    <div className="w-full max-w-xs">
      <p className="mb-2 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">{title}</p>
      <ul className="space-y-3">
        {games.map((g) => {
          const upNext = g.id === upNextId;
          return (
            <li key={g.id}>
              <button
                onClick={() => onOpen(g.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border bg-[color-mix(in_srgb,var(--home-surface)_88%,transparent)] p-3 text-left transition hover:border-[var(--home-brass)] ${
                  upNext ? 'border-[var(--home-gold)] shadow-[0_0_18px_var(--home-gold-glow)]' : 'border-[var(--home-border)]'
                }`}
              >
                <GamePainting gameId={g.id} className="h-16 w-14 shrink-0 rounded-t-full rounded-b-md" />
                <span className="flex-1">
                  <span className="block text-xl font-bold">{g.name}</span>
                  <span className={`text-sm ${upNext ? 'text-[var(--home-gold)]' : 'text-[var(--home-text-muted)]'}`}>
                    {upNext ? 'Up next' : range(g)}
                  </span>
                </span>
                <span className="text-2xl text-[var(--home-text-muted)]" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// One game's page on a phone. Everyone browses games on their own phone;
// only the host's "Play" puts one up next on the TV, and then Start begins
// it. Every mode shares one layout, so the painting, the title and the main
// button sit at the same height on every phone.
//   host-browse: Play {game}, How to play under it
//   host-upnext: Start {game}, How to play under it
//   guest-browse / guest-upnext: How to play, an empty slot under it
export type StageMode = 'host-browse' | 'host-upnext' | 'guest-browse' | 'guest-upnext';

const outlineButton =
  'w-full rounded-xl border-2 border-[var(--home-brass)] bg-[color-mix(in_srgb,var(--home-surface)_88%,transparent)] py-[14px] text-xl font-bold text-[var(--home-gold)] transition hover:border-[var(--home-gold)]';

export function GameStage({
  game,
  players,
  mode,
  hostName,
  onPlay,
  onStart,
  onRules,
}: {
  game: GameInfo;
  players: Player[];
  mode: StageMode;
  hostName: string;
  onPlay: () => void;
  onStart: () => void;
  onRules: () => void;
}) {
  // The server deals in whoever is connected when the game starts.
  const line = playersLine(game, players.filter((p) => p.connected).length);
  const hasRules = !!GAME_UI[game.id]?.Tutorial;
  const host = mode === 'host-browse' || mode === 'host-upnext';
  const upNext = mode === 'host-upnext' || mode === 'guest-upnext';
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center">
      <p
        className={`mb-2 self-start text-xs tracking-widest text-[var(--home-gold)] uppercase ${upNext ? '' : 'invisible'}`}
      >
        Up next
      </p>
      <GamePainting gameId={game.id} className="h-36 w-full rounded-2xl" />
      <div className="mt-5">
        <GameTitle gameId={game.id} name={game.name} />
      </div>
      {GAME_UI[game.id]?.blurb && <p className="mt-1 text-[var(--home-text-muted)]">{GAME_UI[game.id].blurb}</p>}
      <div className="mt-6 h-[72px]">
        <p className={`text-lg ${line.problem ? 'text-[var(--home-ember)]' : 'text-[var(--home-text-muted)]'}`}>
          {line.text}
        </p>
        {mode === 'guest-upnext' && <p className="mt-1 text-[var(--home-text-muted)]">{hostName} is about to start it</p>}
        {mode === 'host-upnext' && <p className="mt-1 text-[var(--home-text-muted)]">It&apos;s up on the TV</p>}
      </div>
      {mode === 'host-browse' && (
        <button onClick={onPlay} className="home-gold-fill mt-4 w-full rounded-xl py-4 text-xl font-bold transition hover:brightness-110">
          Play {game.name}
        </button>
      )}
      {mode === 'host-upnext' && (
        <button
          onClick={onStart}
          disabled={line.problem}
          className="home-gold-fill animate-home-fade mt-4 w-full rounded-xl py-4 text-xl font-bold transition hover:brightness-110"
        >
          Start {game.name}
        </button>
      )}
      {!host && (
        <button onClick={onRules} disabled={!hasRules} className={`mt-4 ${outlineButton} disabled:invisible`}>
          How to play
        </button>
      )}
      {host && hasRules ? (
        <button onClick={onRules} className={`mt-3 ${outlineButton}`}>
          How to play
        </button>
      ) : (
        <div className="mt-3 h-[60px]" aria-hidden="true" />
      )}
    </div>
  );
}

// A guest's heads-up that the host put a game up next, pinned under the top
// bar while they look at something else. Tapping it opens that game.
export function UpNextToast({ game, onOpen }: { game: GameInfo; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Up next: ${game.name}. Open it`}
      className="animate-toast-down fixed inset-x-3 top-[calc(max(1rem,env(safe-area-inset-top))+3.5rem)] z-20 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--home-gold)] bg-[var(--home-surface)] p-2.5 pr-4 text-left shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
    >
      <GamePainting gameId={game.id} className="h-12 w-10 shrink-0 rounded-t-full rounded-b-md" />
      <span className="flex-1 leading-tight">
        <span className="block text-xs tracking-widest text-[var(--home-text-muted)] uppercase">Up next</span>
        <span className="text-lg font-bold">{game.name}</span>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 text-[var(--home-gold)]">
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
