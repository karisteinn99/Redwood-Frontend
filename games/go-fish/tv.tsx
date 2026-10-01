import type { Player } from '@shared/party-types';

import type { GoFishEvent, GoFishPublicView } from './definition';
import { rankLabel } from './rank-glyphs';

// Generic platform dark theme — Go Fish doesn't have its own room identity
// yet (see AGENTS.md: rooms get a dedicated aesthetic as separate, later
// work, same precedent Liar's Dice followed before its Ship reskin).

function eventSentence(event: GoFishEvent, nameOf: (id: string) => string): string {
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

function BookChips({ books }: { books: number[] }) {
  if (books.length === 0) return <span className="text-white/30">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {books.map((rank, i) => (
        <span key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-bold">
          {rankLabel(rank)}
        </span>
      ))}
    </span>
  );
}

export function GoFishTv({ view, players }: { view: GoFishPublicView; players: Player[] }) {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  if (view.winnerIds && view.winnerIds.length > 0) {
    return (
      <div className="flex h-full min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
        <p className="text-sm tracking-widest text-white/50 uppercase">Go Fish</p>
        <p className="mt-6 text-5xl font-bold">
          🏆 {view.winnerIds.map(nameOf).join(' and ')} {view.winnerIds.length > 1 ? 'win!' : 'wins!'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <p className="text-sm tracking-widest text-white/50 uppercase">Go Fish</p>
      <p className="mt-1 text-white/40">{view.stockCount} left in the stock</p>

      <ul className="mt-6 flex flex-wrap justify-center gap-6">
        {view.order.map((id) => (
          <li
            key={id}
            className={`rounded-xl px-5 py-3 text-center ${
              id === view.currentPlayerId ? 'bg-blue-600/30 ring-2 ring-blue-400' : 'bg-white/5'
            }`}
          >
            <p className="text-lg font-medium">{nameOf(id)}</p>
            <p className="text-white/50">
              {'🂠'.repeat(view.handCounts[id] ?? 0)} ({view.handCounts[id] ?? 0})
            </p>
            <div className="mt-2">
              <BookChips books={view.books[id] ?? []} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        {view.lastEvent ? (
          <p className="text-xl">{eventSentence(view.lastEvent, nameOf)}</p>
        ) : (
          <p className="text-white/40">The game begins…</p>
        )}
        <p className="mt-2 text-white/50">{nameOf(view.currentPlayerId)}&apos;s turn</p>
      </div>
    </div>
  );
}
