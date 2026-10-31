import { RulesSheet, type RulesPalette, type RulesTheme } from '../rules-sheet';

const PALETTE: RulesPalette = {
  surface: 'var(--dock-surface)',
  border: 'var(--dock-border)',
  text: 'var(--dock-text)',
  muted: 'var(--dock-text-muted)',
  accent: 'var(--dock-coral)',
  accentInk: 'var(--dock-water-deep)',
  danger: 'var(--dock-coral)',
};

export function GoFishTutorial({
  onClose,
  theme,
}: {
  onClose: () => void;
  theme?: RulesTheme;
}) {
  return (
    <RulesSheet
      title="How to play Go Fish"
      theme={theme}
      palette={PALETTE}
      onClose={onClose}
    >
      <section>
        <p>Your hand is secret</p>
        <p>Everyone starts with 5 cards. Only you can see your own.</p>
      </section>

      <section>
        <p>Ask for a rank you already hold</p>
        <p>
          On your turn, pick one other player and name a rank you have at least
          one of yourself — e.g. &ldquo;got any Sevens?&rdquo;
        </p>
      </section>

      <section>
        <p>They have it, or you go fish</p>
        <p>
          If they have any, they hand over <em>all</em> of them and you go
          again. If they don&apos;t, draw the top card from the stock — draw the
          rank you asked for and you go again, otherwise your turn ends.
        </p>
      </section>

      <section>
        <p>Four of a kind makes a book</p>
        <p>
          Collect all 4 cards of a rank and it&apos;s set aside as a book, out
          of play.
        </p>
      </section>

      <section>
        <p>Most books wins</p>
        <p>
          The game ends once the stock and every hand are empty — every card
          ends up in a book by then. Whoever has the most books wins.
        </p>
      </section>
    </RulesSheet>
  );
}
