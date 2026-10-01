import { useState } from 'react';

import type { Player } from '@shared/party-types';

import { distinctRanks, type GoFishAction, type GoFishPlayerView } from './definition';
import { rankLabel } from './rank-glyphs';

// Generic platform dark theme — see tv.tsx for why Go Fish has no room
// identity of its own yet.

function groupedHand(hand: number[]): { rank: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const rank of hand) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([rank, count]) => ({ rank, count }));
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
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';
  const [targetId, setTargetId] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const isYourTurn = view.yourId === view.currentPlayerId;
  const askableRanks = distinctRanks(view.yourHand);
  const otherPlayers = view.order.filter((id) => id !== view.yourId);

  if (view.winnerIds && view.winnerIds.length > 0) {
    return (
      <div className="flex flex-col items-center text-white">
        <p className="text-3xl font-bold">
          🏆 {view.winnerIds.map(nameOf).join(' and ')} {view.winnerIds.length > 1 ? 'win!' : 'wins!'}
        </p>
      </div>
    );
  }

  const ask = () => {
    if (targetId && rank !== null) {
      send({ type: 'ask', targetId, rank });
      setTargetId(null);
      setRank(null);
    }
  };

  return (
    <div className="flex w-full max-w-xs flex-col items-center text-white">
      <p className="text-white/50">Your hand</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {groupedHand(view.yourHand).map(({ rank: r, count }) => (
          <span key={r} className="rounded-lg bg-white/10 px-3 py-2 text-lg font-bold">
            {rankLabel(r)}
            {count > 1 && <span className="ml-1 text-sm text-white/50">×{count}</span>}
          </span>
        ))}
        {view.yourHand.length === 0 && <span className="text-white/40">Empty — waiting to draw</span>}
      </div>

      {!isYourTurn && <p className="mt-10 text-white/40">Waiting for {nameOf(view.currentPlayerId)}…</p>}

      {isYourTurn && (
        <div className="mt-8 w-full space-y-5">
          <div>
            <p className="mb-2 text-sm text-white/50 uppercase">Ask who?</p>
            <div className="flex flex-wrap gap-2">
              {otherPlayers.map((id) => (
                <button
                  key={id}
                  onClick={() => setTargetId(id)}
                  className={`rounded-lg px-3 py-2 ${targetId === id ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  {nameOf(id)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-white/50 uppercase">For what rank?</p>
            <div className="flex flex-wrap gap-2">
              {askableRanks.map((r) => (
                <button
                  key={r}
                  onClick={() => setRank(r)}
                  className={`h-12 w-12 rounded-lg text-lg font-bold ${rank === r ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  {rankLabel(r)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={ask}
            disabled={!targetId || rank === null}
            className="w-full rounded-xl bg-blue-600 py-4 text-xl font-bold transition hover:bg-blue-500 disabled:opacity-30"
          >
            Ask
          </button>
        </div>
      )}
    </div>
  );
}
