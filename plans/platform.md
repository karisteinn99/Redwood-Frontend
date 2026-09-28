# Platform

Session, realtime, game layer, persistence, deploy. Living file: tick items, add new ones.

**Current focus:** Migrated off PartyKit onto raw Cloudflare Workers/Durable Objects (Wrangler) — see step 3. Verified locally end-to-end (both smoke suites, persistence across a real restart, the occupancy endpoint). Still needed: run `pnpm party:deploy` for real, set `NEXT_PUBLIC_PARTYKIT_HOST` on Vercel, confirm production end-to-end. Robustness: kick/transfer host and pruning stale seats remain.

## Done
- [x] Lobby: TV auto-creates room, QR join, phones join with name
- [x] Player tokens and reconnect, server-decided host, host handover
- [x] Dev: phones on LAN can connect (WS host derived from page host, dev-only `/api/lan`)

## 0. Housekeeping
- [x] Removed geography code, `app/api/admin`, `calculateDistance`, geography schema export
- [x] Removed map/lottie deps and `db:seed`; `pnpm install` run
- Old migrations in `db/migrations` still contain geography tables; regenerate or drop when the DB is actually used.

## 1. Game module interface
- [x] `shared/game.ts`: `GameDefinition<State, Action, View>` with `init`, `reduce`, `viewFor(state, viewer)`, `isFinished`
- [x] Game registry (`games/index.ts`, server-only) + UI registry (`games/ui.tsx`, client-only, kept separate so React stays out of the Worker bundle)
- [x] Room loop: `action -> reduce -> per-connection viewFor` (TV and each phone get different views)
- [x] Protocol: `start {gameId}`, `action {action}`, `view {gameId, view, finished}`, `error {message}` (replaces the `playing` placeholder)
- [x] Demo game (`games/demo/`) proves the split: public counter + per-player secret. Verified with `scripts/room-smoke.mjs` (14 checks) and manually.
- Illegal actions return `{error}` to the acting connection only, no state change. No timers yet. Game pick is host-only.

## 2. Robustness
- [x] Persist room state in the Durable Object's own storage (`ctx.storage`), single `snapshot` key (seats, host, phase, gameId, gameState), loaded inside the constructor's `blockConcurrencyWhile` before any request is handled. Connections never survive a restart, so restored seats start disconnected until their phone reconnects with its token. Originally verified with a mocked-storage harness against the PartyKit-era code; since the Wrangler migration, verified for real against an actual `wrangler dev` restart.
- [x] Mid-game phone reconnect returns the correct private view (covered by the smoke test)
- [x] Room code collisions — `generateRoomCode()` only had 120 possible values (12 words × 1 digit) with zero uniqueness check; two people could land in the same live session. Fixed: expanded to 12 × 100 = 1,200 combinations (`lib/room-code.ts`), and `/` now actively checks a candidate code against a new `onRequest` handler on the PartyKit room (`party/index.ts`, returns `{occupied: seats.size > 0}`, CORS-open) before committing to it, retrying up to 8 times (`app/page.tsx`, `lib/party-host.ts`). Verified against a live room: fresh code reports `occupied:false`, occupied after a seat exists reports `true`, CORS header confirmed present. This was flagged during Liar's Dice testing but never turned into a fix until it was already live in prod — worth remembering that a risk noted in chat isn't fixed until it's in this file as a checkbox.
- [ ] Host: kick player, transfer host
- [ ] Prune disconnected seats in the lobby

## 3. Deploy
- [x] Vercel deployed independently by the user (Next.js frontend only).
- PartyKit's managed platform turned out to be broken in three separate ways at once: the `dashboard.partykit.io` device-login flow errors out (worked around with `npx partykit login -p github`); the shared `*.partykit.dev` zone had hit Cloudflare's 10,000-custom-domains cap, so `npx partykit deploy` couldn't provision a `<name>.<username>.partykit.dev` host at all; and — the one that actually killed it — even deploying with `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` set still failed, because PartyKit's own deploy backend requests the old (pre-SQLite) Durable Object migration type, and Cloudflare now requires `new_sqlite_classes` for any brand-new namespace, on any plan. That's a bug in PartyKit's server-side deploy handling, not something fixable from `partykit.json` or the CLI.
- [x] **Migrated off the `partykit` package entirely.** `party/index.ts` is now a plain Cloudflare Worker + Durable Object class, deployed via **Wrangler** (`wrangler.jsonc` at the repo root, with the `new_sqlite_classes` migration this was all for). Same game logic, same wire protocol, same client code (`partysocket` unchanged — the Worker's own routing replicates PartyKit's `/parties/main/<room>` URL convention on purpose). See AGENTS.md for the implementation details (attachment-based connection tracking, the `@cloudflare/workers-types` vs. DOM types conflict and how it's avoided).
- [x] Verified locally against a real `wrangler dev`: both smoke suites pass unchanged (`room-smoke.mjs` 14/14, `liars-dice-smoke.mjs` 28/28), the occupancy endpoint works with CORS, and — stronger than the old PartyKit-era mocked test — persistence was verified across an actual process restart (killed and restarted `wrangler dev`; a seat survived, correctly marked disconnected).
- [x] `pnpm party:deploy` (`dotenv -e .env.local -- wrangler deploy`) reads `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` from `.env.local`. This also fixed a pre-existing, never-noticed bug where `db:generate`/`migrate`/`studio` silently failed with "dotenv: command not found", since the plain `dotenv` package ships no CLI (swapped for `dotenv-cli`).
- [ ] User to run `pnpm party:deploy` for real (or push to `main` once CI secrets are set, see below), then set `NEXT_PUBLIC_PARTYKIT_HOST` to the resulting host in Vercel's production env vars and redeploy. Only needs doing once — the host doesn't change between deploys.
- [x] CI: `.github/workflows/deploy-party.yml` runs `wrangler deploy` on every push to `main`, mirroring `pnpm party:deploy`. Needs `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` set as GitHub Actions repo secrets (Settings → Secrets and variables → Actions) — separate from both `.env.local` and Vercel's env vars. Unconditional on every push to `main`, not scoped to relevant file changes; fine for now given how fast Worker deploys are.
- [ ] Confirm realtime actually works end-to-end in production once the above lands.
