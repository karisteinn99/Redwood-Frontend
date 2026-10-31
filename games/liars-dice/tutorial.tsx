import { faceGlyph } from './dice-glyphs';

import { RulesSheet, type RulesPalette, type RulesTheme } from '../rules-sheet';

const PALETTE: RulesPalette = {
  surface: 'var(--ship-surface)',
  border: 'var(--ship-border)',
  text: 'var(--ship-text)',
  muted: 'var(--ship-text-muted)',
  accent: 'var(--ship-teal)',
  accentInk: 'var(--ship-bg)',
  danger: 'var(--ship-danger)',
};

export function LiarsDiceTutorial({
  onClose,
  theme,
}: {
  onClose: () => void;
  theme?: RulesTheme;
}) {
  return (
    <RulesSheet
      title="How to play Liar's Dice"
      theme={theme}
      palette={PALETTE}
      onClose={onClose}
    >
      <section>
        <p>Your dice are secret</p>
        <p>Everyone rolls 5 dice each round and only you can see your own.</p>
      </section>

      <section>
        <p>Bid on what&apos;s out there</p>
        <p>
          On your turn, guess how many dice of a face show up across{' '}
          <em>everyone&apos;s</em> hands combined — e.g. &ldquo;{faceGlyph(4)} 3
          × Fours&rdquo; means you think there are at least 3 fours total.
        </p>
      </section>

      <section>
        <p>1s are wild</p>
        <p>
          A rolled {faceGlyph(1)} counts toward any bid, so it&apos;s the
          strongest face to bid on — and to watch out for.
        </p>
      </section>

      <section>
        <p>Raise or call Liar</p>
        <p>
          Each bid must beat the last one — more dice, or the same amount on a
          higher face. If you don&apos;t believe the last bid, call{' '}
          <span className="text-[var(--r-danger)]">Liar!</span> instead.
        </p>
      </section>

      <section>
        <p>For example</p>
        <p>
          Ana opens with <strong>3 × {faceGlyph(4)} Fours</strong>. Ben raises
          to <strong>3 × {faceGlyph(6)} Sixes</strong> — same amount, higher
          face. Cleo raises again to just{' '}
          <strong>3 × {faceGlyph(1)} Ones</strong> — still only 3, but ones beat
          every other face, even sixes. Dan doesn&apos;t buy it and calls{' '}
          <span className="text-[var(--r-danger)]">Liar!</span> — the dice get
          revealed, and whoever was wrong loses a die.
        </p>
      </section>

      <section>
        <p>Someone loses a die</p>
        <p>
          All dice are revealed. If the bid was right, the challenger loses a
          die. If it was wrong, the bidder does. Whoever lost opens the next
          round.
        </p>
      </section>

      <section>
        <p>Last one standing wins</p>
        <p>
          Run out of dice and you&apos;re out. The last player left wins the
          game.
        </p>
      </section>
    </RulesSheet>
  );
}
