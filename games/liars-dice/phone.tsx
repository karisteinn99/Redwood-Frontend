import { useEffect, useState } from 'react';

import type { Player } from '@shared/party-types';

import { faceGlyph, faceLabel } from './dice-glyphs';
import type { Bid, LiarsDiceAction, LiarsDicePlayerView, Reveal } from './definition';
import { isLegalBid, minimumLegalQuantity } from './definition';
import { verdictSentence } from './reveal-text';
import { useRevealStage } from './use-reveal-stage';

// Faces in bidding rank order: 1 (wild) out-ranks every plain face.
const RANKED_FACES = [2, 3, 4, 5, 6, 1];

function buildStageText(reveal: Reveal, you: string, nameOf: (id: string) => string) {
  const isChallenger = you === reveal.challengerId;
  const isBidder = you === reveal.bidderId;
  if (isChallenger) return `You called ${nameOf(reveal.bidderId)}'s bid a lie. Let's check it out…`;
  if (isBidder) return `${nameOf(reveal.challengerId)} thinks you're lying. Let's check it out…`;
  return `${nameOf(reveal.challengerId)} called ${nameOf(reveal.bidderId)}'s bid a lie — check the TV!`;
}

function verdictHeadlineFor(reveal: Reveal, you: string, wasTrue: boolean, nameOf: (id: string) => string) {
  const isChallenger = you === reveal.challengerId;
  const isBidder = you === reveal.bidderId;
  if (isChallenger) return wasTrue ? 'The bid held up — you lose a die.' : 'You were right! They lose a die.';
  if (isBidder) return wasTrue ? 'Your bid held up!' : 'Busted — you lose a die.';
  return `${nameOf(reveal.loserId)} loses a die.`;
}

// Full-bleed background so the Ship's own colors show regardless of the
// generic (bg-gray-900) wrapper the platform-level join page renders around
// every game's Phone component.
function ShipBackdrop() {
  return <div className="fixed inset-0 -z-10 bg-[var(--ship-bg)]" />;
}

function RevealNarrative({
  reveal,
  stage,
  you,
  players,
  isHost,
  acked,
  onContinue,
}: {
  reveal: Reveal;
  stage: 'claim' | 'dice' | 'counting' | 'verdict';
  you: string;
  players: Player[];
  isHost: boolean;
  acked: boolean;
  onContinue: () => void;
}) {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';
  const wasTrue = reveal.loserId === reveal.challengerId;

  if (stage !== 'verdict') {
    return (
      <div className="flex flex-col items-center text-center text-[var(--ship-text)]">
        <ShipBackdrop />
        <p className="text-2xl font-bold">{buildStageText(reveal, you, nameOf)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center text-[var(--ship-text)]">
      <ShipBackdrop />
      <p className="text-2xl font-bold text-[var(--ship-lantern)]" style={{ textShadow: '0 0 16px var(--ship-lantern-glow)' }}>
        {verdictHeadlineFor(reveal, you, wasTrue, nameOf)}
      </p>
      <p className="mt-4 text-sm text-[var(--ship-text-muted)]">{verdictSentence(reveal, nameOf)}</p>

      {acked ? (
        <p className="mt-8 text-[var(--ship-text-muted)]">Waiting for the others…</p>
      ) : (
        <button
          onClick={onContinue}
          className="mt-8 w-full max-w-xs rounded-xl py-4 text-xl font-bold text-[var(--ship-bg)] transition hover:brightness-110"
          style={{ background: 'var(--ship-teal)' }}
        >
          {isHost ? 'Continue for everyone' : 'Continue'}
        </button>
      )}
    </div>
  );
}

// Smallest legal raise over the current bid, or a sensible first bid.
function minimumNextBid(current: Bid | null): Bid {
  if (!current) return { quantity: 1, face: 2 };
  const idx = RANKED_FACES.indexOf(current.face);
  if (idx < RANKED_FACES.length - 1) return { quantity: current.quantity, face: RANKED_FACES[idx + 1] };
  return { quantity: current.quantity + 1, face: RANKED_FACES[0] };
}

export function LiarsDicePhone({
  view,
  players,
  send,
}: {
  view: LiarsDicePlayerView;
  players: Player[];
  send: (action: LiarsDiceAction) => void;
}) {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';
  const [bid, setBid] = useState<Bid>(() => minimumNextBid(view.currentBid));
  const { stage } = useRevealStage(view.lastReveal);

  // Keep the suggested bid a legal raise whenever the current bid changes.
  useEffect(() => setBid(minimumNextBid(view.currentBid)), [view.currentBid?.quantity, view.currentBid?.face]);

  const isYourTurn = view.yourId === view.currentPlayerId;

  if (view.lastReveal) {
    const isHost = players.find((p) => p.id === view.yourId)?.isHost ?? false;
    return (
      <RevealNarrative
        reveal={view.lastReveal}
        stage={stage}
        you={view.yourId}
        players={players}
        isHost={isHost}
        acked={view.revealAcks.includes(view.yourId)}
        onContinue={() => send({ type: 'continue' })}
      />
    );
  }

  if (view.winnerId) {
    return (
      <div className="flex flex-col items-center text-[var(--ship-text)]">
        <ShipBackdrop />
        <p className="text-3xl font-bold text-[var(--ship-lantern)]" style={{ textShadow: '0 0 16px var(--ship-lantern-glow)' }}>
          🏆 {nameOf(view.winnerId)} wins!
        </p>
      </div>
    );
  }

  const canLower = bid.quantity > 1 && isLegalBid({ ...bid, quantity: bid.quantity - 1 }, view.currentBid);

  return (
    <div className="flex w-full max-w-xs flex-col items-center text-[var(--ship-text)]">
      <ShipBackdrop />
      <p className="text-[var(--ship-text-muted)]">Your dice</p>
      <p className="mt-1 text-3xl">{view.yourDice.map((d) => faceGlyph(d)).join(' ')}</p>

      <div className="mt-6 text-center">
        {view.currentBid ? (
          <p className="text-2xl font-bold">
            {view.currentBid.quantity} × {faceLabel(view.currentBid.face)}
          </p>
        ) : (
          <p className="text-[var(--ship-text-muted)]">No bid yet</p>
        )}
      </div>

      {isYourTurn ? (
        <div className="mt-8 w-full space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => canLower && setBid((b) => ({ ...b, quantity: b.quantity - 1 }))}
              disabled={!canLower}
              className="h-12 w-12 rounded-xl bg-white/10 text-xl disabled:opacity-20"
            >
              −
            </button>
            <span className="w-10 text-center text-2xl font-bold">{bid.quantity}</span>
            <button
              onClick={() => setBid((b) => ({ ...b, quantity: b.quantity + 1 }))}
              className="h-12 w-12 rounded-xl bg-white/10 text-xl"
            >
              +
            </button>
          </div>
          {/* Every face is always pickable — choosing one snaps the quantity
              down to the cheapest legal bid for it, rather than disabling
              faces that would otherwise be a perfectly good bid. */}
          <div className="grid grid-cols-6 gap-2">
            {RANKED_FACES.map((face) => (
              <button
                key={face}
                onClick={() => setBid({ face, quantity: minimumLegalQuantity(face, view.currentBid) })}
                className="rounded-lg py-2 text-lg"
                style={{
                  background: bid.face === face ? 'var(--ship-teal)' : 'rgba(255,255,255,0.1)',
                  color: bid.face === face ? 'var(--ship-bg)' : undefined,
                }}
              >
                {faceGlyph(face)}
              </button>
            ))}
          </div>
          <button
            onClick={() => send({ type: 'bid', quantity: bid.quantity, face: bid.face })}
            className="w-full rounded-xl py-4 text-xl font-bold text-[var(--ship-bg)] transition hover:brightness-110"
            style={{ background: 'var(--ship-teal)' }}
          >
            Bid {bid.quantity} × {faceLabel(bid.face)}
          </button>
          <button
            onClick={() => send({ type: 'challenge' })}
            disabled={!view.currentBid}
            className="w-full rounded-xl py-4 text-xl font-bold text-white transition hover:brightness-110 disabled:opacity-30"
            style={{ background: 'var(--ship-danger)' }}
          >
            Liar!
          </button>
        </div>
      ) : (
        <p className="mt-10 text-[var(--ship-text-muted)]">Waiting for {nameOf(view.currentPlayerId)}…</p>
      )}
    </div>
  );
}
