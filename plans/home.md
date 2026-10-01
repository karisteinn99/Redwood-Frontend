# Home

The lobby-as-place: game picker, arrivals, rooms, characters. Living file: tick items, add new ones.
Depends on the game interface in `platform.md` step 1.

**Current focus:** Home's cozy-cabin identity now covers the full player-facing flow, not just the TV — the phone's "come inside" join screen, the room-creation loading screen (`/`), and the post-join lobby/game-picker screen all use `--home-*` tokens now (previously generic dark/blue). Next: visually verify the responsive/portal behavior for real, then decide between lobby polish (2) or the house (3).

## 1. Thin Home
- [x] Lobby becomes Home: game list on the phone (host only), TV renders the running game
- [x] Return to Home when a game finishes (host's "Back home" button; no auto-return yet)
- [x] Home's own visual identity: cozy cabin — `app/components/home/home-tv.tsx`, tokens/keyframes in `app/globals.css` (`--home-*`, flame flicker, portal glow/sparks, twinkle). Real join card (actual QR, code, join URL), doors row (Ship door live, Lounge/locked decorative), guest list. Design history in `.planning/sketches/home/` (4 rounds — see that folder's README for what was tried and rejected before landing here).
- [x] Door-portal transition: TV plays a clip-path "iris" growing from the Ship door's screen position when the host starts Liar's Dice, instead of a hard cut — `app/room/[code]/page.tsx`. Client-side timing only (`PORTAL_MS`), no server involvement; the door's position is cached via a layout effect just before it unmounts, since the game's own render replaces Home and the ref would otherwise be gone by the time the transition effect runs.
- [ ] Visually verify in a real browser: responsive fit at various window sizes (the `[@media(max-height:700px)]:flex-row` breakpoint switching join-card-left/doors-right hasn't been eyeballed), and the portal transition's timing/feel.
- [x] The Lounge's slot is now Go Fish's real door (see `plans/games/go-fish.md`) — doors are driven by `games/rooms.ts`'s `ROOM_DOORS`, not hardcoded per-door JSX, so a third room just means one more entry.
- [ ] The locked door is still purely decorative — no room/game exists behind it yet.

## 2. Lobby polish
- [ ] "Let someone in" QR overlay for late joins
- [ ] Avatars / character choice
- [ ] Arrival animation ("Sara is home")

## 3. The house
- [ ] Rooms as categories, doors as the game picker
- [ ] Characters and per-room hosts
- [ ] Locked doors hinting at future content
- Decision: each room gets its own permanent aesthetic (not a player-selectable global theme). First room built: "the Ship" (pirate/Davy Jones), for dice/bluffing games. Sketch history in `.planning/sketches/the-ship/`.
