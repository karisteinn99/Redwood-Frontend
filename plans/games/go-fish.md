# Go Fish

Second real game, built to prove the `GameDefinition` interface generalizes beyond Liar's Dice: no elimination (nobody's ever removed from `order`), no bluffing/reveal-pause mechanic (nothing to referee — an ask's outcome is unambiguous and instant), a different shape of hidden information. Replaces the previously-decorative "Lounge" door slot on Home.

**Visual identity:** deliberately generic dark theme for now (`bg-gray-900`, `blue-600` accents) — no dedicated room aesthetic yet. Same precedent Liar's Dice followed: ship functional first, reskin later as separate work.

## Rules locked in
- Standard 52-card deck; only rank (1–13) matters, suits are never modeled.
- Every player starts with 5 cards, fixed regardless of player count. Remainder is a face-down stock pile.
- On your turn: pick **one specific other player** (not the whole table) and name **one rank you already hold**.
  - They have it → hand over **all** matching cards, you go again.
  - They don't → "go fish": draw the stock's top card. Drew the asked rank → go again. Otherwise, turn passes.
- Four matching cards in hand = a "book" (set aside, public, out of play).
- Game ends once the stock is empty **and** every hand is empty — equivalent to all 13 books being complete, since every card not yet in a book must be in a hand or the stock. Most books wins; ties are shown as joint winners.

## Assumptions (easy to change)
- **Empty-hand rule:** if it becomes your turn with an empty hand, you draw one free card from the stock first (no ask consumed) if the stock has cards; if the stock is also empty too, your turn is skipped. A house-rule simplification — avoids a player getting permanently stuck at 0 cards the instant their hand empties, without needing a more elaborate re-deal mechanic.
- **Fixed 5-card hand** regardless of player count (real-world variants sometimes deal 7 for 2 players) — kept simple.
- **Display name** "Go Fish" — the traditional name of the game; one-line change (`games/rooms.ts`, `definition.ts`'s `name`) if a different label is wanted.

## State (`GoFishState`)
```ts
interface GoFishState {
  order: string[];                    // fixed at init, nobody is ever removed
  hands: Record<string, number[]>;    // unbooked cards currently held
  books: Record<string, number[]>;    // completed ranks, public
  stock: number[];                    // face-down pile, index 0 = top
  currentPlayerId: string;
  lastEvent: GoFishEvent | null;      // public commentary, non-blocking
}
```
`hands` only ever goes into a player's own view; `books`/`handCounts` (a derived count, not raw hands) are public. `winnerIds` is computed on the fly in `viewFor` from `books`, not stored — avoids a derived field drifting out of sync with the source of truth.

## Actions
- `{ type: 'ask'; targetId: string; rank: number }` — only `currentPlayerId`, only if they hold `rank` themselves, `targetId` must be a different real player.

## Resolution
`reduce` validates turn/target/rank, then:
- Target has the rank → transfer all matching cards, settle books, **same player continues**.
- Target doesn't, stock has cards → draw the top card; matches the asked rank → continue; otherwise → turn passes.
- Target doesn't, stock is empty → turn passes immediately.

Every exit path runs a `resolveTurn` pass (the empty-hand free-draw-or-skip logic) before returning — needed for both "next player's turn" and "same player continues" cases, since a completed book can leave the *current* player at 0 cards mid-turn, not just at a turn boundary. Bounded by `order.length + 1` iterations; can't loop forever since total remaining cards only decreases, so whenever the game isn't over, someone in `order` always holds a card.

## Views
- **TV**: player list with hand *counts* (not contents) and a turn-ring highlight, each player's books as rank chips, stock count, a one-line public commentary on the last ask, a winner banner (handles ties by listing every winner).
- **Phone**: everything the TV shows, plus your own hand grouped by rank. On your turn: pick a target (any other player — targeting someone with 0 cards is legal, just guaranteed to "fish", since you can't know their hand for certain beyond the public count) and a rank restricted to `distinctRanks(yourHand)`, then Ask. Off-turn: "Waiting for {name}…".

## Tutorial
- Same modal shell as Liar's Dice's (`fixed inset-0`, click-outside-to-close, ✕ button), generic dark theme.
- Prose-only for v1 (no worked example) — five short sections: hand is secret, ask for a rank you hold, hit-or-fish, books of four, most books wins.

## Files
- `games/go-fish/definition.ts` — the `GameDefinition`, plus exported `distinctRanks` (the only pre-validatable illegal move — who to target has no legal-move restriction, since not knowing the target's hand is the entire point of the game).
- `games/go-fish/rank-glyphs.ts` — `rankLabel` (A/J/Q/K display), mirrors `dice-glyphs.ts`'s separation of presentation from game logic.
- `games/go-fish/tv.tsx`, `phone.tsx`, `tutorial.tsx`.
- `games/index.ts` — register `goFishGame`.
- `games/ui.tsx` — register `'go-fish'` UI.
- `games/rooms.ts` (new) — `ROOM_DOORS`, the client-side game-id → door-label map Home's door row and the portal-transition logic both key off, replacing the single hardcoded `shipDoorRef`/`'liars-dice'` string check that only ever supported one live door.

## Verification
- `scripts/go-fish-smoke.mjs`: since hands are genuinely randomized (`ctx.random`), the script can't assert a fixed sequence of exact outcomes. It drives the game adaptively — the harness "cheats" by peeking at every player's actual hand (something no real player could do) to always ask a guaranteed hit when one's available, falling back to any legal ask otherwise — inside a bounded guard loop (mirrors `liars-dice-smoke.mjs`'s own bounded-retry pattern for randomness). Checks: TV never sees hand contents, a player's own view does; deterministic illegal-move rejections (out-of-turn, self-target, asking for an unheld rank); a card-conservation invariant (`sum(hands) + sum(books)×4 + stock === 52`) holds every round; the game reaches `finished` with a non-empty `winnerIds` well within the guard bound (empirically ~50–60 real asks for 3 players, against a 500-round cap).
  - Note: an earlier version of this test drove the game with fully blind-random target/rank choices and didn't reliably converge within any reasonable bound — informed (guaranteed-hit-seeking) driving was needed, since blind guessing has no memory of what's already been asked and can stall for a very long time by chance even though the game itself can never truly deadlock (proven by the deck-conservation math: whenever the stock is empty and the game isn't over, some rank held by the current player must have its remaining copies in another player's hand, since books only ever form as complete groups of 4).
- `scripts/room-smoke.mjs` was rewritten to use Liar's Dice (not Go Fish, and no longer the removed `demo` game) as its generic-platform-behavior vehicle — see `plans/platform.md`.
- `npx tsc --noEmit` clean.
- Manual: TV + 2 phones, play a full round to a winner, open the tutorial, confirm Home's left door now reads "Go Fish" and portals into it the same way Liar's Dice's door does.
