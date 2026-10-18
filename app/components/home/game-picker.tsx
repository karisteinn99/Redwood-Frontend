import { useId } from 'react';

import { ROOM_DOORS } from '@/games/rooms';
import { GAME_UI } from '@/games/ui';
import type { GameInfo } from '@shared/game';
import type { Player } from '@shared/party-types';

import { PlayerToken } from '../player-token';
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

// Why a game can't start with this many people, or null if it can.
function countProblem(g: GameInfo, count: number): string | null {
  if (count < g.minPlayers) {
    const short = g.minPlayers - count;
    return `Needs ${short} more player${short === 1 ? '' : 's'}`;
  }
  if (count > g.maxPlayers) return `${g.maxPlayers} players at most`;
  return null;
}

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

export function GameList({ games, onPick }: { games: GameInfo[]; onPick: (gameId: string) => void }) {
  return (
    <div className="w-full max-w-xs">
      <p className="mb-2 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">Pick a game</p>
      <ul className="space-y-3">
        {games.map((g) => (
          <li key={g.id}>
            <button
              onClick={() => onPick(g.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-[var(--home-border)] bg-[color-mix(in_srgb,var(--home-surface)_88%,transparent)] p-3 text-left transition hover:border-[var(--home-brass)]"
            >
              <GamePainting gameId={g.id} className="h-16 w-14 shrink-0 rounded-t-full rounded-b-md" />
              <span className="flex-1">
                <span className="block text-xl font-bold">{g.name}</span>
                <span className="text-sm text-[var(--home-text-muted)]">{range(g)}</span>
              </span>
              <span className="text-2xl text-[var(--home-text-muted)]" aria-hidden="true">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GamePage({
  game,
  players,
  onBack,
  onStart,
  onRules,
}: {
  game: GameInfo;
  players: Player[];
  onBack: () => void;
  onStart: () => void;
  onRules: () => void;
}) {
  // The server deals in whoever is connected when the game starts.
  const playing = players.filter((p) => p.connected);
  const problem = countProblem(game, playing.length);
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center">
      <button
        onClick={onBack}
        className="mb-4 self-start py-2 text-[var(--home-text-muted)] hover:text-[var(--home-text)]"
      >
        ‹ Home
      </button>
      <GamePainting gameId={game.id} className="h-36 w-full rounded-2xl" />
      <div className="mt-5">
        <GameTitle gameId={game.id} name={game.name} />
      </div>
      {GAME_UI[game.id]?.blurb && <p className="mt-1 text-[var(--home-text-muted)]">{GAME_UI[game.id].blurb}</p>}
      <p className="mt-6 text-[var(--home-text-muted)]">
        <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--home-brass)] italic">
          {playing.length}
        </span>{' '}
        of {range(game)} home
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {playing.map((p) => (
          <PlayerToken key={p.id} avatar={p.avatar} className="h-9 w-9" />
        ))}
      </div>
      {GAME_UI[game.id]?.Tutorial && (
        <button onClick={onRules} className="mt-5 text-sm text-[var(--home-text-muted)] underline underline-offset-2">
          How to play
        </button>
      )}
      <button
        onClick={onStart}
        disabled={!!problem}
        className="mt-8 w-full rounded-xl bg-[var(--home-magic)] py-4 text-xl font-bold text-[var(--home-bg)] transition hover:brightness-110 disabled:bg-[var(--home-surface)] disabled:text-[var(--home-text-muted)] disabled:hover:brightness-100"
      >
        {problem ?? `Start ${game.name}`}
      </button>
    </div>
  );
}

export function UpNext({
  game,
  hostName,
  onRules,
}: {
  game: GameInfo;
  hostName: string;
  onRules: () => void;
}) {
  return (
    <div className="mt-10 flex w-full max-w-xs flex-col items-center text-center">
      <p className="mb-2 self-start text-xs tracking-widest text-[var(--home-text-muted)] uppercase">Up next</p>
      <GamePainting gameId={game.id} className="h-28 w-full rounded-2xl" />
      <div className="mt-4">
        <GameTitle gameId={game.id} name={game.name} />
      </div>
      <p className="mt-1 text-[var(--home-text-muted)]">{hostName} is about to start it</p>
      {GAME_UI[game.id]?.Tutorial && (
        <button
          onClick={onRules}
          className="mt-6 w-full rounded-xl border border-[var(--home-magic)] py-3 text-lg font-bold text-[var(--home-magic)]"
        >
          How to play
        </button>
      )}
    </div>
  );
}
