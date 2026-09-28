import type { Player } from '@shared/party-types';

import { faceGlyph, faceLabel } from './dice-glyphs';
import type { LiarsDicePublicView } from './definition';
import { revealGroups } from './reveal-dice';
import { claimSentence, verdictSentence } from './reveal-text';
import { useRevealStage } from './use-reveal-stage';

function DieChip({ face, matches, counted }: { face: number; matches: boolean; counted: boolean }) {
  return (
    <span
      className={`inline-flex h-14 w-14 items-center justify-center rounded-xl text-4xl transition-all duration-300 ${
        counted
          ? 'scale-110 bg-yellow-400/20 text-yellow-300 ring-4 ring-yellow-400'
          : matches
            ? 'bg-white/10 text-white'
            : 'bg-white/5 text-white/25'
      }`}
      style={counted ? { boxShadow: '0 0 18px rgba(250,204,21,0.6)' } : undefined}
    >
      {faceGlyph(face)}
    </span>
  );
}

export function LiarsDiceTv({ view, players }: { view: LiarsDicePublicView; players: Player[] }) {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';
  const { stage, highlightedCount } = useRevealStage(view.lastReveal);

  if (view.lastReveal) {
    const reveal = view.lastReveal;

    if (stage === 'claim') {
      return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black px-6 text-center">
          <p className="max-w-3xl text-4xl leading-snug font-bold">{claimSentence(reveal, nameOf)}</p>
        </div>
      );
    }

    const groups = revealGroups(reveal);
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black px-6">
        <div className="flex flex-wrap justify-center gap-10">
          {groups.map(({ playerId, dice }) => (
            <div key={playerId} className="rounded-2xl border border-white/10 px-5 py-4">
              <p className="mb-3 text-center text-lg font-medium text-white/70">{nameOf(playerId)}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {dice.map((d, i) => (
                  <DieChip
                    key={i}
                    face={d.face}
                    matches={d.matches}
                    counted={d.matches && d.matchIndex! < highlightedCount}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {stage === 'verdict' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-6 text-center">
            <p className="max-w-3xl text-4xl leading-snug font-bold text-blue-400">
              {verdictSentence(reveal, nameOf)}
            </p>
            <p className="mt-8 text-white/40">
              {view.revealAcks.length}/{view.order.length} ready to continue
            </p>
          </div>
        )}
      </div>
    );
  }

  if (view.winnerId) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-sm tracking-widest text-white/40 uppercase">Liar&apos;s Dice</p>
        <p className="mt-6 text-6xl font-bold">🏆 {nameOf(view.winnerId)} wins!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm tracking-widest text-white/40 uppercase">Liar&apos;s Dice</p>

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
              {'🎲'.repeat(view.diceCounts[id] ?? 0)} ({view.diceCounts[id] ?? 0})
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        {view.currentBid ? (
          <p className="text-4xl font-bold">
            {view.currentBid.quantity} × {faceGlyph(view.currentBid.face)}{' '}
            <span className="text-2xl text-white/40">{faceLabel(view.currentBid.face)}</span>
          </p>
        ) : (
          <p className="text-2xl text-white/40">No bid yet</p>
        )}
        <p className="mt-2 text-white/50">{nameOf(view.currentPlayerId)}&apos;s turn</p>
      </div>
    </div>
  );
}
