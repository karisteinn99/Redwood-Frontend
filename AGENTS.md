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
- Realtime: a plain Cloudflare Worker + Durable Object (`party/index.ts`, one `HomeRoom` instance per session), deployed via **Wrangler** — not PartyKit. Next.js serves the UI only.
- **Migrated off the `partykit` npm package** (was PartyKit's managed platform + CLI). It had three separate live bugs at the same time: a broken `dashboard.partykit.io` device-login flow, the shared `*.partykit.dev` zone hitting Cloudflare's 10,000-custom-domains cap, and PartyKit's own deploy backend still requesting the pre-SQLite Durable Object migration type (Cloudflare now requires `new_sqlite_classes` for any new namespace, platform-wide, any billing tier). None of these were fixable from this repo — see `plans/platform.md` for the full trail. The rewrite is a straight port: same game logic, same wire protocol, same client code, only the server's own "shell" (connections, storage, broadcasting) changed to Cloudflare's native Durable Object APIs.
- The server is authoritative. Clients never decide host, turn order or game outcomes.
- Roles: `tv` and `player`, tracked per-connection via `ws.serializeAttachment()`/`deserializeAttachment()` (survives Durable Object hibernation) rather than a separate id→role map. The TV is never a player. Host is a permission on a player, not session ownership.
- Identity: player `token` in localStorage (`gohome:<code>`) reclaims the same seat on reconnect. A seat's "is it currently connected" status is tracked at runtime only (`liveSockets: Map<seatId, WebSocket>`), never persisted — a live `WebSocket` object obviously isn't serializable, and isn't meaningful after a restart anyway.
- Host: first connected player; reassigned to the next connected player if the host drops.
- Shared vs private: each game exposes `viewFor(state, viewer)`. Secrets must never be sent to the TV or other players, not even hidden by CSS.
- Wire types live in `shared/party-types.ts`; import via `@shared/*`. The client (`partysocket`) is unchanged by the PartyKit→Wrangler migration — the Worker's top-level `fetch` deliberately replicates PartyKit's own `/parties/main/<room>` URL convention so `lib/party-host.ts`/`use-party-room.ts`/the occupancy check never needed to change.
- **TypeScript gotcha**: `@cloudflare/workers-types` declares its own `WebSocket`/`Request`/`Response`, which conflict with the DOM lib types the rest of the app (browser code) needs. Don't add `@cloudflare/workers-types` to tsconfig's global `types`/`lib`. Instead, `party/index.ts` explicitly type-imports (`import type {...} from '@cloudflare/workers-types'`) just the names it needs — those imports are file-scoped and erased at compile time, so they don't leak into `app/`'s DOM-typed code. `WebSocketPair` is a genuine Workers runtime global with no npm-importable value (like `fetch`); it's declared locally in `party/index.ts` with a bare `declare const`, which also stays module-scoped since the file has imports/exports.
- Room codes look like `JOLLY-42`; always run them through `normalizeRoomCode`. The code space alone is not collision-proof — `/` actively checks a candidate against the room's occupancy endpoint (a plain GET to `/parties/main/<code>`, answered by `HomeRoom.fetch()` with `{occupied: seats.size > 0}`) and retries, rather than trusting randomness. Host resolution (dev vs. prod) is centralized in `lib/party-host.ts`; don't re-derive it inline.
- No accounts, no DB needed for the lobby or games yet. Postgres/drizzle setup exists but is unused.
- Game interface (`shared/game.ts`): a game is `{init, reduce, viewFor, isFinished}`, pure TS, no React/Workers imports. State/actions/views must be JSON-serializable. `viewFor(state, viewer)` is the *only* place that may filter secrets — never trust a client to hide its own view.
- `reduce` returns `{state}` or `{error}`; on error only the acting connection is notified and state is unchanged. No exceptions for game-logic errors.
- Server-side game registry lives in `games/index.ts` (no React). Client-side `{Tv, Phone}` components live in `games/ui.tsx`. Keep them separate — React must not end up in the Worker bundle.
- One folder per game under `games/<id>/` (definition + Tv/Phone components). Game pick is host-only for now.
- `GameContext.random()` is the only source of randomness in `init`/`reduce`, so game logic stays testable.
- Persistence: `HomeRoom` writes a full snapshot (seats, host, phase, gameId, gameState) to `ctx.storage` after every state change, and reloads it inside the constructor's `ctx.blockConcurrencyWhile(...)` (guarantees no request is handled until that finishes — the equivalent of PartyKit's old `onStart` running before `onConnect`/`onRequest`). Sockets never survive a restart — restored seats always start disconnected until the phone reconnects with its token. Verified against a real `wrangler dev` restart (not just a mock): a seat survived, correctly marked disconnected.
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
- Run `pnpm party:dev` (`wrangler dev`, port 1999) and `pnpm dev` (port 3000) in separate terminals.
- Open the TV on `localhost:3000`; the QR uses the LAN IP (dev-only `/api/lan`) so phones on the same Wi-Fi can join. Trusted networks only.
- Verify with `npx tsc --noEmit`, and the two smoke tests (`scripts/room-smoke.mjs [port]`, `scripts/liars-dice-smoke.mjs [port]`) against a running `pnpm party:dev` — both pass against the Worker exactly as they did against PartyKit, since the wire protocol didn't change.
- Env-loaded scripts (`db:*`, `party:deploy`) use `dotenv-cli` (the `dotenv` package alone ships no CLI — mixing the two up broke `db:generate`/`migrate`/`studio` silently until fixed). Always put `--` before the wrapped command in these scripts, or a flag the wrapped command takes (e.g. `node -e`) can collide with `dotenv-cli`'s own flags and get silently swallowed.
- Deploy: `pnpm party:deploy` (`dotenv -e .env.local -- wrangler deploy`) reads `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` from `.env.local` (gitignored). `wrangler.jsonc` at the repo root is the config (Durable Object binding + the `new_sqlite_classes` migration this whole migration was for). After deploying, `NEXT_PUBLIC_PARTYKIT_HOST` must be set to the resulting host in Vercel's production env vars and the app redeployed (it's inlined at build time) — only needed once, the host is stable across redeploys.
- `.github/workflows/deploy-party.yml` runs that same deploy automatically on every push to `main`, using `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` as GitHub Actions repo secrets (a third, separate copy from `.env.local` and Vercel's env vars — GitHub Actions can't read either of those). This is independent of Vercel's own build, which only covers the Next.js frontend.
- `.wrangler/` (Wrangler's local dev state, including the persisted local Durable Object storage) is gitignored.

## Conventions
- Concise code, comments only where intent isn't obvious.
- Don't stage or commit unless explicitly asked.
- Update the matching plan file in the same change as the work; keep `PLAN.md`'s current focus in sync.
- Plan files are living: add new items, mark deferred/dropped ones with a reason, never silently delete. Bounded finished efforts may move to `plans/done/`.
- One file per game in `plans/games/`; durable architecture rules go here, not in plans.
