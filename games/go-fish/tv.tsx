import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

import { CardBack, CardFace, FannedBacks } from './card';
import type { GoFishEvent, GoFishPublicView } from './definition';
import { DockScenery } from './dock-scenery';
import { rankLabel } from './rank-glyphs';

// Go Fish lives on the Dock — its own permanent room identity (see
// AGENTS.md), tokens `--dock-*` in app/globals.css.

export function eventSentence(
  event: GoFishEvent,
  nameOf: (id: string) => string
): string {
  const asker = nameOf(event.askerId);
  const target = nameOf(event.targetId);
  const rank = rankLabel(event.rank);
  if (event.type === 'transfer') {
    return `${asker} asked ${target} for ${rank}s — got ${event.count}!`;
  }
  if (event.type === 'fish-hit') {
    return `${asker} asked ${target} for ${rank}s, went fish, and drew one!`;
  }
  return `${asker} asked ${target} for ${rank}s and went fish.`;
}

// No event id in state (none is needed for game logic), so a fresh event is
// detected from everything an ask can change. Purely cosmetic: re-keys the
// commentary line so its splash animation replays.
export function eventKey(view: GoFishPublicView): string {
  return `${view.stockCount}|${JSON.stringify(view.handCounts)}|${JSON.stringify(view.lastEvent)}`;
}

function Books({ books }: { books: number[] }) {
  if (books.length === 0) return null;
  return (
    <span className="flex flex-wrap justify-center gap-1">
      {books.map((rank, i) => (
        <CardFace key={i} rank={rank} size="sm" />
      ))}
    </span>
  );
}

export function GoFishTv({
  view,
  players,
}: {
  view: GoFishPublicView;
  players: Player[];
}) {
  const player = (id: string) => players.find((p) => p.id === id);
  const nameOf = (id: string) => player(id)?.name ?? '?';

  if (view.winnerIds && view.winnerIds.length > 0) {
    return (
      <div className="flex h-full min-h-screen w-full flex-col items-center justify-center px-6 text-center text-[var(--dock-text)]">
        <DockScenery />
        <p className="text-sm tracking-widest text-[var(--dock-text-muted)] uppercase">
          Go Fish · the Dock
        </p>
        <p className="mt-6 flex gap-4">
          {view.winnerIds.map((id) => (
            <PlayerToken key={id} avatar={player(id)?.avatar ?? ''} className="h-[clamp(4rem,10vh,7rem)] w-[clamp(4rem,10vh,7rem)]" />
          ))}
        </p>
        <p
          className="mt-2 text-[clamp(2rem,4.5vw,3.5rem)] font-bold text-[var(--dock-sun)]"
          style={{ textShadow: '0 0 24px var(--dock-sun-glow)' }}
        >
          {view.winnerIds.map(nameOf).join(' and ')}{' '}
          {view.winnerIds.length > 1 ? 'win!' : 'wins!'}
        </p>
        <ul className="mt-10 flex flex-wrap justify-center gap-6">
          {view.order.map((id) => (
            <li key={id} className="flex flex-col items-center gap-2">
              <span className="text-lg">
                <PlayerToken avatar={player(id)?.avatar ?? ''} className="mr-[0.3em] inline-block h-[1.2em] w-[1.2em] align-[-0.25em]" />
                {nameOf(id)} ·{' '}
                {view.books[id]?.length ?? 0}
              </span>
              <Books books={view.books[id] ?? []} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen w-full flex-col items-center justify-between px-6 py-[clamp(1rem,4vh,3rem)] text-[var(--dock-text)]">
      <DockScenery />
      <p className="text-sm tracking-widest text-[var(--dock-text-muted)] uppercase">
        Go Fish · the Dock
      </p>

      <ul className="flex flex-wrap justify-center gap-[clamp(0.75rem,2vw,1.5rem)]">
        {view.order.map((id) => {
          const active = id === view.currentPlayerId;
          return (
            <li
              key={id}
              className={`flex min-w-[9rem] flex-col items-center gap-2 rounded-2xl border px-4 py-3 transition ${
                active
                  ? 'border-[var(--dock-coral)]'
                  : 'border-[var(--dock-border)]'
              }`}
              style={{
                background:
                  'color-mix(in srgb, var(--dock-surface) 85%, transparent)',
                boxShadow: active
                  ? '0 0 22px var(--dock-coral-glow)'
                  : undefined,
              }}
            >
              <p className="text-[clamp(1rem,1.8vw,1.3rem)] font-medium">
                <PlayerToken avatar={player(id)?.avatar ?? ''} className="mr-[0.3em] inline-block h-[1.2em] w-[1.2em] align-[-0.25em]" />
                {nameOf(id)}
              </p>
              <FannedBacks count={view.handCounts[id] ?? 0} />
              <Books books={view.books[id] ?? []} />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-end">
          <CardBack size="lg" className="absolute top-1 left-1 opacity-60" />
          <CardBack size="lg" className="relative" />
          <span className="ml-4 text-[var(--dock-text-muted)]">
            {view.stockCount > 0
              ? `${view.stockCount} in the pond`
              : 'The pond is empty'}
          </span>
        </div>
        <div key={eventKey(view)} className="animate-splash text-center">
          {view.lastEvent ? (
            <p className="text-[clamp(1.25rem,2.6vw,2rem)] font-medium">
              {view.lastEvent.type === 'transfer' ? '🎣 ' : '🌊 '}
              {eventSentence(view.lastEvent, nameOf)}
            </p>
          ) : (
            <p className="text-[var(--dock-text-muted)]">Lines in the water…</p>
          )}
        </div>
      </div>

      <p className="text-[clamp(1rem,2vw,1.4rem)]">
        <span className="text-[var(--dock-coral)]">
          <PlayerToken avatar={player(view.currentPlayerId)?.avatar ?? ''} className="mr-[0.3em] inline-block h-[1.2em] w-[1.2em] align-[-0.25em]" />
          {nameOf(view.currentPlayerId)}
        </span>
        &apos;s turn
      </p>
    </div>
  );
}
