# Platform

Session, realtime, game layer, persistence, deploy. Living file: tick items, add new ones.

**Current focus:** Liar's Dice (`plans/games/liars-dice.md`). Robustness: kick/transfer host and pruning stale seats remain.

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
- [x] Game registry (`games/index.ts`, server-only) + UI registry (`games/ui.tsx`, client-only, kept separate so React stays out of the PartyKit bundle)
- [x] Room loop: `action -> reduce -> per-connection viewFor` (TV and each phone get different views)
- [x] Protocol: `start {gameId}`, `action {action}`, `view {gameId, view, finished}`, `error {message}` (replaces the `playing` placeholder)
- [x] Demo game (`games/demo/`) proves the split: public counter + per-player secret. Verified with `scripts/room-smoke.mjs` (14 checks) and manually.
- Illegal actions return `{error}` to the acting connection only, no state change. No timers yet. Game pick is host-only.

## 2. Robustness
- [x] Persist room state in PartyKit storage — `room.storage`, single `snapshot` key (seats, host, phase, gameId, gameState), loaded in `onStart` before any connection is handled. Connections never survive a restart, so restored seats start disconnected until their phone reconnects with its token. Verified with a mocked-storage harness (2 fresh `HomeRoom` instances sharing one storage map): seats, host and game state all survive, reconnect-by-token works with no duplicate seat.
- [x] Mid-game phone reconnect returns the correct private view (covered by the smoke test)
- [ ] Host: kick player, transfer host
- [ ] Prune disconnected seats in the lobby

## 3. Deploy
- [ ] PartyKit + Vercel, `gohomegames.com`
