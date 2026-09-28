import { useEffect, useState } from 'react';

import type { Reveal } from './definition';

export type RevealStage = 'claim' | 'dice' | 'counting' | 'verdict';

// Purely local pacing, no server timer involved — the server sends the whole
// reveal in one shot (tagged with a fresh id per challenge) and each screen
// stages it through the same beats: the claim, then the board, then a
// die-by-die count, then the verdict. Verdict is sticky — it does NOT
// auto-advance; the game only moves on once the reveal is acknowledged
// (a `continue` action clears `lastReveal` server-side), which is reflected
// upstream by the reveal disappearing from the view entirely.
const CLAIM_MS = 2200;
const BOARD_PAUSE_MS = 900;
const PER_DIE_MS = 450;

export function useRevealStage(reveal: Reveal | null | undefined) {
  const [stage, setStage] = useState<RevealStage>('claim');
  const [highlightedCount, setHighlightedCount] = useState(0);
  const revealId = reveal?.id;

  useEffect(() => {
    if (!revealId) return;
    setStage('claim');
    setHighlightedCount(0);
    const toDice = setTimeout(() => setStage('dice'), CLAIM_MS);
    const toCounting = setTimeout(() => setStage('counting'), CLAIM_MS + BOARD_PAUSE_MS);
    return () => {
      clearTimeout(toDice);
      clearTimeout(toCounting);
    };
  }, [revealId]);

  useEffect(() => {
    if (stage !== 'counting' || !reveal) return;
    if (reveal.actualCount === 0) {
      const t = setTimeout(() => setStage('verdict'), 700);
      return () => clearTimeout(t);
    }
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setHighlightedCount(count);
      if (count >= reveal.actualCount) {
        clearInterval(interval);
        setTimeout(() => setStage('verdict'), 600);
      }
    }, PER_DIE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, revealId]);

  return { stage, highlightedCount };
}
