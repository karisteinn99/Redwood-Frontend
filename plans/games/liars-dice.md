# Liar's Dice

First real game: proves the shared/private split with a game that's actually fun, replaces the demo.
Depends on `platform.md` step 1 (done). **Built, playable, and now visually the Ship's own game** (was plain dark Tailwind for a while — the pirate identity had only been designed in sketches and used for the Home portal's placeholder screen, never actually carried into the real `games/liars-dice/tv.tsx`/`phone.tsx`; fixed).

## Visual identity: the Ship
- Tokens in `app/globals.css` (`--ship-*`), same pattern as Home's `--home-*`. `games/liars-dice/ship-scenery.tsx` is the persistent backdrop (hull ribs, porthole, swinging lantern) used behind every screen — subtle enough that dice/text stay legible, since this is a functional game screen, not a mood board.
- Teal (`--ship-teal`) is the "counted/active" accent (matching dice, current turn, primary buttons); lantern-amber (`--ship-lantern`) is reserved for the big verdict/winner lines, matching the sketch's warm/cool blend.
- Verified: `tsc` clean, `liars-dice-smoke.mjs` still 28/28 (purely visual change, protocol untouched), both `/room` and `/join` routes load without import-time errors.

**Rules locked in:** 1s are wild (count toward any bid). The player who lost the last challenge opens the next round's bidding.

## Setup
- 2–8 players, 5 dice each (`STARTING_DICE = 5`).
- Turn order = join order at game start, skipping eliminated players.
- Each round: every player still in the game rerolls all their current dice, privately.

## State (`LiarsDiceState`)
```ts
interface LiarsDiceState {
  order: string[];              // playerIds, turn order, fixed for the game
  dice: Record<string, number[]>;   // each player's current hidden dice
  currentPlayerId: string;
  currentBid: { quantity: number; face: number } | null; // null = no bid yet this round
  bidHistory: { playerId: string; quantity: number; face: number }[]; // this round, for the TV log
  lastReveal: {                 // set after a challenge, kept until the next challenge
    challengerId: string; bidderId: string;
    bid: { quantity: number; face: number }; actualCount: number;
    loserId: string; allDice: Record<string, number[]>;
  } | null;
  winnerId: string | null;
}
```
`dice` only ever goes into a *player's own* view; `lastReveal.allDice` is a deliberate public reveal, so it goes into every view once set. This is a good test of `viewFor` beyond just "hide the secret".

## Actions
- `{ type: 'bid'; quantity: number; face: number }` — only `currentPlayerId`, only while `winnerId` is null.
- `{ type: 'challenge' }` — only `currentPlayerId`, only if `currentBid` is not null (can't challenge before anyone has bid).

**Bid ordering (assumption, easy to change):** classic Liar's Dice has a fiddly doubling rule when switching between bidding on 1s and other faces. To keep it simple, I'm ranking faces `2,3,4,5,6,1` (1 highest) and requiring the next bid to have either a higher quantity, or the same quantity with a higher-ranked face. This keeps 1-bids strong without the doubling math. Tell me if you'd rather have the classic exchange-rate rule.

## Resolution
- **bid**: validate turn + ordering, append to `bidHistory`, set `currentBid`, advance `currentPlayerId` to the next alive player.
- **challenge**: count actual dice matching `currentBid.face` across all alive players (1s count as wild unless the bid itself is on 1s); compare to `currentBid.quantity`.
  - Bid was true (actual ≥ quantity) → challenger loses a die.
  - Bid was false → the bidder loses a die.
  - Set `lastReveal`. If the loser hits 0 dice, they're eliminated from `order`.
  - If one player remains, set `winnerId` and stop (isFinished).
  - Otherwise: everyone remaining rerolls, clear `currentBid`/`bidHistory`, `currentPlayerId` = the loser (per your rule), next round begins.

## Views
- **TV**: player list with remaining dice *counts* only, whose turn it is, the current bid, and a winner banner when finished. During a reveal, see "Reveal sequence" below instead.
- **Phone**: everything the TV shows, plus the player's own dice values. On your turn: a bid control (quantity stepper + face picker) and a "Liar!" button. Off-turn: read-only, "Waiting for {name}…".

## Tutorial
- Pure client-side, no protocol involvement — it's static content, not game state.
- `games/liars-dice/tutorial.tsx`: a short scrollable "How to play" — what a bid means, 1s are wild, calling Liar, losing a die, winning. Dark theme, Tailwind, a couple of illustrated example bids (e.g. "3 × 4s" shown against a row of dice glyphs).
- Reachable from the phone's Home screen next to the game list ("How to play"), viewable any time, not just before starting. No auto-popup in v1 — a button is enough to start.

## Reveal sequence (replaces the old inline reveal banner)
The game genuinely pauses on a challenge — `reduce` rejects `bid`/`challenge` with an error while `state.lastReveal` is set, so this isn't just a UI overlay masking an already-advanced game underneath.

- **`continue` action**: any seated player can send it once there's a pending `lastReveal`; not turn-gated. Tracked in `state.revealAcks`. Clears `lastReveal` (and resets `revealAcks`) once either every player still in `order` has acked, **or** the host sends it (instant override, e.g. for an AFK player). Needed a platform change: `GameContext` gained `hostId: string | null`, built fresh per call in `party/index.ts` (`gameCtx()`) since host can change over disconnects.
- **Client-only staged animation** (`use-reveal-stage.ts`), keyed on `reveal.id` so a fresh challenge restarts it: `claim` (~2.2s, big text: "Kári says there are at least 3 fives. Rós says it's a lie.") → `dice` (board appears, grouped per player — bidder and challenger's groups first, dice not yet counted) → `counting` (die-by-die glow effect ticks through every matching die across all groups, ~450ms each, driven by `highlightedCount`) → `verdict` (sticky — no auto-advance; overlays the still-visible, now fully-counted board: "There are 5 fives. Kári's claim is a lie. Kári loses a die." plus an "N/M ready to continue" line and each phone's own Continue button).
- Phone shows a condensed, role-specific line during `claim`/`dice`/`counting` (challenger/bidder/bystander each get their own phrasing) and again at `verdict`, plus the neutral verdict sentence underneath, plus Continue (labeled "Continue for everyone" for the host).
- The final, game-ending challenge plays through this same sequence before the winner banner — it isn't skipped.
- Bid legality is enforced only through disabling, never a round-trip error: the phone computes it client-side via `isLegalBid`/`minimumLegalQuantity` (exported from `definition.ts`, same rule the server uses). Every face button is always tappable — tapping one snaps the quantity down to the cheapest legal bid for that face, rather than fading faces out. The quantity `−` stays enabled down to whatever's still legal for the *currently selected* face, disabling only at that floor.
- Known trade-off carried over: reconnecting while a reveal is the most recent event replays its animation from scratch (keyed on `reveal.id`, which persists in state until acknowledged). Harmless.

## Files
- `games/liars-dice/definition.ts` — the `GameDefinition`, replacing `demo` as the default listed game (demo stays in the registry as a test fixture).
- `games/liars-dice/tv.tsx`, `phone.tsx`, `tutorial.tsx`, `reveal-dice.ts` (per-player grouping + counting order), `reveal-text.ts` (claim/verdict sentences), `use-reveal-stage.ts` (the client-side stage machine), `dice-glyphs.ts`.
- `games/ui.tsx` — extend `GameUi` with an optional `Tutorial` component.
- `games/index.ts` — register `liarsDiceGame`.
- `shared/game.ts` — `GameContext.hostId`.

## Verification
- `scripts/liars-dice-smoke.mjs` (28 checks): full game flow, TV never sees `dice`, `lastReveal.allDice` public once set, bid legality, the pause-until-continue mechanic (blocked bidding, partial acks don't clear it, host override does), play to a winner.
- A one-off script separately confirmed the "everyone acks, no host override" path.
- Manual: TV + phones on LAN, play a full game, open the tutorial from a phone.

## Open questions for you
1. ~~Bid ordering rule above (simplified vs. classic doubling)~~ — resolved: kept the simplified ladder (explained the classic exchange-rate alternative, not switching to it).
2. ~~Demo game: currently kept in the registry as a test fixture~~ — resolved: removed once Go Fish became the second real game (see `plans/games/go-fish.md`).
3. ~~Anything you want in the tutorial beyond the rules themselves~~ — resolved: added a compact worked example ("For example" section) walking through an opening bid, a same-quantity raise onto a stronger face, a raise onto 1s, and a challenge — the tutorial previously never explicitly stated that 1 outranks even 6 for raising purposes, despite calling 1s "the strongest face" elsewhere.

## Bug found and fixed while testing
`party/index.ts` gated every post-hello message (host-only), a leftover from before the game layer existed — so only the host could ever send a game `action`. Fixed: `start`/`home` stay host-only, `action` works for any seated player. Also: `start` now sends a proper `error` back to the host when it can't start (too few connected players, unknown game, already playing) instead of silently doing nothing — this was the actual cause of "the button does nothing."

## Interactivity & reveal polish (this round)
- **No more error round-trips for illegal bids.** The phone now computes bid legality client-side (`isLegalBid`, exported from `definition.ts` so the client and server share one rule) and disables controls instead: the quantity `−` button disables once lowering would drop below what's legal for the currently selected face; face buttons that aren't a legal raise at the current quantity are faded and non-clickable. The server still validates independently as a safety net.
- **Big unmissable reveal on the TV.** On a challenge, the TV switches to a fullscreen overlay: first every player's actual dice, large, with "count them yourselves" — held for a few seconds — then a big verdict line ("X called Y's bid a lie… the bid stood its ground! X loses a die.") plus the bid vs. actual count. Timing is a fixed two-stage local animation (`use-reveal-stage.ts`, ~3.5s + ~4.5s), *not* a server timer — the server sends the whole reveal in one shot (including a fresh `id` per challenge so the client can detect "this is new" and restart the animation), and each screen paces itself. The same sequence now also plays for the game-ending challenge, before the winner banner.
- **Condensed, role-specific narrative on the phone.** During the same window, the phone shows only a short line, no dice board: the challenger sees "You called X's bid a lie…" then the result from their side; the accused bidder sees the mirror version; everyone else sees a condensed "X called Y's bid a lie — check the TV!" then who lost a die. No bid controls are shown until the sequence finishes, so the next bidder can't cut the group's shared moment short.
- Known trade-off: reconnecting/refreshing right as `lastReveal` is the most recent event replays the ~8s animation from scratch (it's keyed on `lastReveal.id`, which persists in state). Harmless, arguably charming, not worth engineering around yet.
