import { useState } from 'react';

import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

import { CardFan } from './card';
import {
  distinctRanks,
  SUITS,
  type Card,
  type GoFishAction,
  type GoFishPlayerView,
} from './definition';
import { DockBackdrop } from './dock-scenery';
import { rankLabel } from './rank-glyphs';
import { eventKey, eventSentence } from './tv';

// The Dock, phone side — see tv.tsx. Your hand doubles as the rank picker:
// on your turn, tap a card to ask for that rank.

function groupedHand(hand: Card[]): { rank: number; cards: Card[] }[] {
  return distinctRanks(hand).map((rank) => ({
    rank,
    cards: hand
      .filter((c) => c.rank === rank)
      .sort((a, b) => SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)),
  }));
}

export function GoFishPhone({
  view,
  players,
  send,
}: {
  view: GoFishPlayerView;
  players: Player[];
  send: (action: GoFishAction) => void;
}) {
  const player = (id: string) => players.find((p) => p.id === id);
  const nameOf = (id: string) => player(id)?.name ?? '?';
  const [targetId, setTargetId] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const isYourTurn = view.yourId === view.currentPlayerId;
  const askableRanks = distinctRanks(view.yourHand);
  const otherPlayers = view.order.filter((id) => id !== view.yourId);
  // A selection can go stale between turns (e.g. that rank was booked).
  const chosenRank = rank !== null && askableRanks.includes(rank) ? rank : null;

  if (view.winnerIds && view.winnerIds.length > 0) {
    const youWon = view.winnerIds.includes(view.yourId);
    return (
      <div className="flex flex-col items-center text-center text-[var(--dock-text)]">
        <DockBackdrop />
        <p className="text-5xl">{youWon ? '🏆' : '🎣'}</p>
        <p className="mt-4 text-3xl font-bold text-[var(--dock-sun)]">
          {youWon && view.winnerIds.length === 1
            ? 'You win!'
            : `${view.winnerIds.map(nameOf).join(' and ')} ${view.winnerIds.length > 1 ? 'win!' : 'wins!'}`}
        </p>
        <p className="mt-2 text-[var(--dock-text-muted)]">
          You made {view.books[view.yourId]?.length ?? 0} books
        </p>
      </div>
    );
  }

  const ask = () => {
    if (targetId && chosenRank !== null) {
      send({ type: 'ask', targetId, rank: chosenRank });
      setTargetId(null);
      setRank(null);
    }
  };

  return (
    <div className="flex w-full max-w-xs flex-col items-center text-[var(--dock-text)]">
      <DockBackdrop />

      {view.lastEvent && (
        <p
          key={eventKey(view)}
          className="animate-splash mb-6 text-center text-sm text-[var(--dock-text-muted)]"
        >
          {eventSentence(view.lastEvent, nameOf)}
        </p>
      )}

      <p className="text-xs tracking-widest text-[var(--dock-text-muted)] uppercase">
        Your hand{isYourTurn && ' — tap a rank'}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-4">
        {groupedHand(view.yourHand).map(({ rank: r, cards }) => (
          <button
            key={r}
            onClick={() => setRank(r)}
            disabled={!isYourTurn}
            aria-label={`Ask for ${rankLabel(r)}s`}
            className="disabled:cursor-default"
          >
            <CardFan
              cards={cards}
              size="lg"
              selected={isYourTurn && chosenRank === r}
            />
          </button>
        ))}
        {view.yourHand.length === 0 && (
          <span className="text-[var(--dock-text-muted)]">
            Empty — you&apos;ll draw on your turn
          </span>
        )}
      </div>
      {(view.books[view.yourId]?.length ?? 0) > 0 && (
        <p className="mt-4 text-sm text-[var(--dock-text-muted)]">
          Your books: {view.books[view.yourId].length}
        </p>
      )}

      {!isYourTurn && (
        <p className="mt-10 text-[var(--dock-text-muted)]">
          Waiting for{' '}
          <PlayerToken avatar={player(view.currentPlayerId)?.avatar ?? ''} className="mr-[0.3em] inline-block h-[1.2em] w-[1.2em] align-[-0.25em]" />
          {nameOf(view.currentPlayerId)}…
        </p>
      )}

      {isYourTurn && (
        <div className="mt-8 w-full space-y-5">
          <div>
            <p className="mb-2 text-xs tracking-widest text-[var(--dock-text-muted)] uppercase">
              Ask who?
            </p>
            <div className="flex flex-wrap gap-2">
              {otherPlayers.map((id) => (
                <button
                  key={id}
                  onClick={() => setTargetId(id)}
                  className={`rounded-xl border px-3 py-2 transition ${
                    targetId === id
                      ? 'border-[var(--dock-coral)] bg-[var(--dock-coral)] font-bold text-[var(--dock-water-deep)]'
                      : 'border-[var(--dock-border)] bg-[var(--dock-surface)]'
                  }`}
                >
                  <PlayerToken avatar={player(id)?.avatar ?? ''} className="mr-[0.3em] inline-block h-[1.2em] w-[1.2em] align-[-0.25em]" />
                  {nameOf(id)}
                  <span className="ml-1 text-xs opacity-60">
                    ({view.handCounts[id] ?? 0})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={ask}
            disabled={!targetId || chosenRank === null}
            className="w-full rounded-xl bg-[var(--dock-coral)] py-4 text-xl font-bold text-[var(--dock-water-deep)] transition hover:brightness-110 disabled:opacity-30"
          >
            {targetId && chosenRank !== null
              ? `Ask ${nameOf(targetId)} for ${rankLabel(chosenRank)}s`
              : 'Ask'}
          </button>
        </div>
      )}
    </div>
  );
}
