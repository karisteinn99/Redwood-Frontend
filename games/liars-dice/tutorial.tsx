import { faceGlyph } from './dice-glyphs';

export function LiarsDiceTutorial({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-gray-900 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-2">
          <p className="text-xl font-bold">How to play Liar&apos;s Dice</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-2xl leading-none text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 pb-6 text-white/70">
          <section>
            <p className="font-medium text-white">Your dice are secret</p>
            <p>Everyone rolls 5 dice each round and only you can see your own.</p>
          </section>

          <section>
            <p className="font-medium text-white">Bid on what's out there</p>
            <p>
              On your turn, guess how many dice of a face show up across{' '}
              <em>everyone&apos;s</em> hands combined — e.g. &ldquo;{faceGlyph(4)} 3 × Fours&rdquo; means you
              think there are at least 3 fours total.
            </p>
          </section>

          <section>
            <p className="font-medium text-white">1s are wild</p>
            <p>
              A rolled {faceGlyph(1)} counts toward any bid, so it&apos;s the strongest face to bid on —
              and to watch out for.
            </p>
          </section>

          <section>
            <p className="font-medium text-white">Raise or call Liar</p>
            <p>
              Each bid must beat the last one — more dice, or the same amount on a higher face. If you
              don&apos;t believe the last bid, call <span className="text-red-400">Liar!</span> instead.
            </p>
          </section>

          <section>
            <p className="font-medium text-white">Someone loses a die</p>
            <p>
              All dice are revealed. If the bid was right, the challenger loses a die. If it was wrong,
              the bidder does. Whoever lost opens the next round.
            </p>
          </section>

          <section>
            <p className="font-medium text-white">Last one standing wins</p>
            <p>Run out of dice and you&apos;re out. The last player left wins the game.</p>
          </section>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 py-3 text-lg font-bold transition hover:bg-blue-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
