# AGENTS.md

Living rules for this repo. Add to it as decisions are made; keep entries short.
Roadmap: `PLAN.md` (index) links to `plans/platform.md`, `plans/home.md` and `plans/games/*.md`.

## Product
- Go Home: a browser game-night platform. TV/shared screen shows public state; each phone is a player's private controller.
- Opening the site on the TV creates the session. Nobody touches the TV afterwards.
- Home is the umbrella; games live in rooms inside it. Build the multiplayer/game architecture first, the fiction later.
- Clarity beats metaphor when they conflict.
- **Rooms have distinct, permanent aesthetics — themes are not player-selectable.** A player never picks "the app's skin"; they walk into a different-looking room (e.g. "the Ship" for dice/bluffing games). This keeps Home a single persistent, authored world so recurring characters and easter eggs still work across games. See `.planning/sketches/MANIFEST.md`.

## Architecture
- Realtime: PartyKit (`party/index.ts`), one room per session. Next.js serves the UI only.
- The server is authoritative. Clients never decide host, turn order or game outcomes.
- Roles: `tv` and `player`. The TV is never a player. Host is a permission on a player, not session ownership.
- Identity: player `token` in localStorage (`gohome:<code>`) reclaims the same seat on reconnect.
- Host: first connected player; reassigned to the next connected player if the host drops.
- Shared vs private: each game exposes `viewFor(state, viewer)`. Secrets must never be sent to the TV or other players, not even hidden by CSS.
- Wire types live in `shared/party-types.ts`; import via `@shared/*`.
- Room codes look like `JOLLY-7`; always run them through `normalizeRoomCode`.
- No accounts, no DB needed for the lobby or games yet. Postgres/drizzle setup exists but is unused.
- Game interface (`shared/game.ts`): a game is `{init, reduce, viewFor, isFinished}`, pure TS, no React/PartyKit imports. State/actions/views must be JSON-serializable. `viewFor(state, viewer)` is the *only* place that may filter secrets — never trust a client to hide its own view.
- `reduce` returns `{state}` or `{error}`; on error only the acting connection is notified and state is unchanged. No exceptions for game-logic errors.
- Server-side game registry lives in `games/index.ts` (no React). Client-side `{Tv, Phone}` components live in `games/ui.tsx`. Keep them separate — React must not end up in the PartyKit worker bundle.
- One folder per game under `games/<id>/` (definition + Tv/Phone components). Game pick is host-only for now.
- `GameContext.random()` is the only source of randomness in `init`/`reduce`, so game logic stays testable.
- Persistence: the room writes a full snapshot (seats, host, phase, gameId, gameState) to `room.storage` after every state change, and reloads it in `onStart` (runs before any connection is handled). Connections never survive a restart — restored seats always start disconnected until the phone reconnects with its token.
- The snapshot's `gameState` is versioned (`GAME_STATE_VERSION` in `party/index.ts`). **Bump it whenever a game's state shape changes in a way an old persisted `gameState` wouldn't satisfy** (new required field, changed meaning of a field, etc.) — a version mismatch on load drops that room's in-progress game back to the lobby (seats/host are kept) instead of restoring a shape the current game code doesn't expect. Forgetting this is what caused a `view.revealAcks is undefined` crash once already.
- `start`/`home` are host-only; `action` is any seated player. When a host action can't proceed (e.g. `start` failing a player-count check), send an `error` back explaining why — never fail silently. A silent no-op is indistinguishable from a bug to the person tapping the button.
- Dramatic/timed moments (reveals, countdowns) stay client-side, purely cosmetic pacing — no server timers. The server computes and sends the full result in one shot (with a fresh id if the client needs to detect "this is new" and restart an animation); each screen stages its own local `setTimeout`/`setInterval` sequence off that id. See `games/liars-dice/use-reveal-stage.ts` for the pattern.
- If a moment needs the group to actually pause (not just look paused), the pause must be real game state the server enforces in `reduce`, not just a UI screen that declines to show controls — otherwise a raw action can slip through underneath while every screen is still mid-animation. Liar's Dice's "wait for everyone to continue past the reveal" works this way: `reduce` rejects further moves while a reveal is unacknowledged.
- A game wanting a host-only override inside its own `reduce` reads `ctx.hostId` (added to `GameContext` for exactly this) rather than the platform layer special-casing that game.
- Prefer disabling illegal moves in the UI (computed from the same exported rule the server uses) over letting the user hit send and get an error back. Keep server-side validation too, as a safety net, not the primary feedback path.

## Frontend
- Next.js App Router, TypeScript strict, React client components for realtime pages.
- Routes: `/` creates a room, `/room/[code]` is the TV, `/join/[code]` is the phone.
- Shared client code in `lib/` (`use-party-room.ts` for the socket).
- WebSocket host defaults to `<page hostname>:1999`; override with `NEXT_PUBLIC_PARTYKIT_HOST`.

## Styling and theme
- Tailwind only. No per-component CSS files. Shared design tokens (CSS custom properties) and one-off `@keyframes`/`.animate-*` utility classes live in `app/globals.css` (the same place `.animate-fade-in` already lived) — not scattered per component.
- Generic/platform-level UI (the join flow's plainer states, anything not yet given its own identity) stays the old minimal dark theme: `bg-gray-900`, white text, `white/40`–`white/50` secondary text, `blue-600` primary actions.
- Home and each room have their **own** authored identity per the room-theming decision above — they don't use the generic dark theme. Home's tokens (`--home-*`) and its component (`app/components/home/home-tv.tsx`) came out of the design sketches in `.planning/sketches/home/`; treat that folder as the source of truth for *why* a color/element looks the way it does, not just the code.
- TV screens: large type, readable from across a room. Phone screens: single column, big tap targets, `max-w-xs` controls.
- Responsive fit: prefer fluid sizing (`clamp()` via Tailwind arbitrary values) so a screen shrinks smoothly, and only fall back to a structural layout change (e.g. a `[@media(max-height:...)]:` breakpoint switching stacked→side-by-side) when it's genuinely cramped — see `home-tv.tsx` for the pattern.
- Keep UI minimal until the game layer works — this applied fully before Home had its own identity; it still applies to anything that doesn't yet.

## Dev workflow
- Run `pnpm party:dev` (port 1999) and `pnpm dev` (port 3000) in separate terminals.
- Open the TV on `localhost:3000`; the QR uses the LAN IP (dev-only `/api/lan`) so phones on the same Wi-Fi can join. Trusted networks only.
- Verify with `npx tsc --noEmit`.

## Conventions
- Concise code, comments only where intent isn't obvious.
- Don't stage or commit unless explicitly asked.
- Update the matching plan file in the same change as the work; keep `PLAN.md`'s current focus in sync.
- Plan files are living: add new items, mark deferred/dropped ones with a reason, never silently delete. Bounded finished efforts may move to `plans/done/`.
- One file per game in `plans/games/`; durable architecture rules go here, not in plans.
