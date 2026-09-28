import type { Player } from '@shared/party-types';

import { faceGlyph, faceLabel } from './dice-glyphs';
import type { LiarsDicePublicView } from './definition';
import { revealGroups } from './reveal-dice';
import { claimSentence, verdictSentence } from './reveal-text';
import { ShipScenery } from './ship-scenery';
import { useRevealStage } from './use-reveal-stage';

function DieChip({ face, matches, counted }: { face: number; matches: boolean; counted: boolean }) {
  return (
    <span
      className={`inline-flex h-14 w-14 items-center justify-center rounded-xl text-4xl transition-all duration-300 ${
        counted
          ? 'scale-110 text-[var(--ship-teal)] ring-4 ring-[var(--ship-teal)]'
          : matches
            ? 'bg-white/10 text-[var(--ship-text)]'
            : 'bg-white/5 text-white/25'
      }`}
      style={
        counted
          ? { background: 'color-mix(in srgb, var(--ship-teal) 20%, transparent)', boxShadow: '0 0 18px var(--ship-teal-glow)' }
          : undefined
      }
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
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 text-center text-[var(--ship-text)]">
          <ShipScenery />
          <p className="max-w-3xl text-4xl leading-snug font-bold">{claimSentence(reveal, nameOf)}</p>
        </div>
      );
    }

    const groups = revealGroups(reveal);
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 text-[var(--ship-text)]">
        <ShipScenery />
        <div className="flex flex-wrap justify-center gap-10">
          {groups.map(({ playerId, dice }) => (
            <div
              key={playerId}
              className="rounded-2xl border border-[var(--ship-border)] bg-[color-mix(in_srgb,var(--ship-surface)_88%,black)] px-5 py-4"
            >
              <p className="mb-3 text-center text-lg font-medium text-[var(--ship-text-muted)]">{nameOf(playerId)}</p>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--ship-bg)_80%,transparent)] px-6 text-center">
            <p
              className="max-w-3xl text-4xl leading-snug font-bold text-[var(--ship-lantern)]"
              style={{ textShadow: '0 0 22px var(--ship-lantern-glow)' }}
            >
              {verdictSentence(reveal, nameOf)}
            </p>
            <p className="mt-8 text-[var(--ship-text-muted)]">
              {view.revealAcks.length}/{view.order.length} ready to continue
            </p>
          </div>
        )}
      </div>
    );
  }

  if (view.winnerId) {
    return (
      <div className="relative flex h-full min-h-screen flex-col items-center justify-center text-[var(--ship-text)]">
        <ShipScenery />
        <p className="text-sm tracking-widest text-[var(--ship-text-muted)] uppercase">Liar&apos;s Dice</p>
        <p className="mt-6 text-6xl font-bold text-[var(--ship-lantern)]" style={{ textShadow: '0 0 22px var(--ship-lantern-glow)' }}>
          🏆 {nameOf(view.winnerId)} wins!
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen flex-col items-center justify-center text-[var(--ship-text)]">
      <ShipScenery />
      <p className="text-sm tracking-widest text-[var(--ship-text-muted)] uppercase">Liar&apos;s Dice</p>

      <ul className="mt-6 flex flex-wrap justify-center gap-6">
        {view.order.map((id) => (
          <li
            key={id}
            className={`rounded-xl px-5 py-3 text-center ${
              id === view.currentPlayerId
                ? 'ring-2 ring-[var(--ship-teal)]'
                : 'border border-[var(--ship-border)] bg-[var(--ship-surface)]'
            }`}
            style={id === view.currentPlayerId ? { background: 'color-mix(in srgb, var(--ship-teal) 18%, var(--ship-surface))' } : undefined}
          >
            <p className="text-lg font-medium">{nameOf(id)}</p>
            <p className="text-[var(--ship-text-muted)]">
              {'🎲'.repeat(view.diceCounts[id] ?? 0)} ({view.diceCounts[id] ?? 0})
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        {view.currentBid ? (
          <p className="text-4xl font-bold">
            {view.currentBid.quantity} × {faceGlyph(view.currentBid.face)}{' '}
            <span className="text-2xl text-[var(--ship-text-muted)]">{faceLabel(view.currentBid.face)}</span>
          </p>
        ) : (
          <p className="text-2xl text-[var(--ship-text-muted)]">No bid yet</p>
        )}
        <p className="mt-2 text-[var(--ship-text-muted)]">{nameOf(view.currentPlayerId)}&apos;s turn</p>
      </div>
    </div>
  );
}
