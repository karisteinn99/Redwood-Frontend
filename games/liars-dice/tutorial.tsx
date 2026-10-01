import { faceGlyph } from './dice-glyphs';

export function LiarsDiceTutorial({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border border-[var(--ship-border)] bg-[var(--ship-surface)] text-[var(--ship-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-2">
          <p className="text-xl font-bold">How to play Liar&apos;s Dice</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-2xl leading-none text-[var(--ship-text-muted)] hover:text-[var(--ship-text)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 pb-6 text-[var(--ship-text-muted)]">
          <section>
            <p className="font-medium text-[var(--ship-text)]">Your dice are secret</p>
            <p>Everyone rolls 5 dice each round and only you can see your own.</p>
          </section>

          <section>
            <p className="font-medium text-[var(--ship-text)]">Bid on what's out there</p>
            <p>
              On your turn, guess how many dice of a face show up across{' '}
              <em>everyone&apos;s</em> hands combined — e.g. &ldquo;{faceGlyph(4)} 3 × Fours&rdquo; means you
              think there are at least 3 fours total.
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--ship-text)]">1s are wild</p>
            <p>
              A rolled {faceGlyph(1)} counts toward any bid, so it&apos;s the strongest face to bid on —
              and to watch out for.
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--ship-text)]">Raise or call Liar</p>
            <p>
              Each bid must beat the last one — more dice, or the same amount on a higher face. If you
              don&apos;t believe the last bid, call{' '}
              <span style={{ color: 'var(--ship-danger)' }}>Liar!</span> instead.
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--ship-text)]">For example</p>
            <p>
              Ana opens with <strong>3 × {faceGlyph(4)} Fours</strong>. Ben raises to{' '}
              <strong>3 × {faceGlyph(6)} Sixes</strong> — same amount, higher face. Cleo raises again to
              just <strong>3 × {faceGlyph(1)} Ones</strong> — still only 3, but ones beat every other
              face, even sixes. Dan doesn&apos;t buy it and calls{' '}
              <span style={{ color: 'var(--ship-danger)' }}>Liar!</span> — the dice get revealed, and
              whoever was wrong loses a die.
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--ship-text)]">Someone loses a die</p>
            <p>
              All dice are revealed. If the bid was right, the challenger loses a die. If it was wrong,
              the bidder does. Whoever lost opens the next round.
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--ship-text)]">Last one standing wins</p>
            <p>Run out of dice and you&apos;re out. The last player left wins the game.</p>
          </section>

          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-lg font-bold text-[var(--ship-bg)] transition hover:brightness-110"
            style={{ background: 'var(--ship-teal)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
