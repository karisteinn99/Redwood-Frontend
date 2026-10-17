export function GoFishTutorial({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border border-[var(--dock-border)] bg-[var(--dock-surface)] text-[var(--dock-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-2">
          <p className="text-xl font-bold">🎣 How to play Go Fish</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-2xl leading-none text-[var(--dock-text-muted)] hover:text-[var(--dock-text)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 pb-6 text-[var(--dock-text-muted)]">
          <section>
            <p className="font-medium text-[var(--dock-text)]">Your hand is secret</p>
            <p>Everyone starts with 5 cards. Only you can see your own.</p>
          </section>

          <section>
            <p className="font-medium text-[var(--dock-text)]">Ask for a rank you already hold</p>
            <p>
              On your turn, pick one other player and name a rank you have at least one of yourself —
              e.g. &ldquo;got any Sevens?&rdquo;
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--dock-text)]">They have it, or you go fish</p>
            <p>
              If they have any, they hand over <em>all</em> of them and you go again. If they don&apos;t,
              draw the top card from the stock — draw the rank you asked for and you go again, otherwise
              your turn ends.
            </p>
          </section>

          <section>
            <p className="font-medium text-[var(--dock-text)]">Four of a kind makes a book</p>
            <p>Collect all 4 cards of a rank and it&apos;s set aside as a book, out of play.</p>
          </section>

          <section>
            <p className="font-medium text-[var(--dock-text)]">Most books wins</p>
            <p>
              The game ends once the stock and every hand are empty — every card ends up in a book by
              then. Whoever has the most books wins.
            </p>
          </section>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--dock-coral)] py-3 text-lg font-bold text-[var(--dock-water-deep)] transition hover:brightness-110"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
