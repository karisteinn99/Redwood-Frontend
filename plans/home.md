# Home

The lobby-as-place: game picker, arrivals, rooms, characters. Living file: tick items, add new ones.
Depends on the game interface in `platform.md` step 1.

**Current focus:** The Home TV is rebuilt from the finished Home TV design review (mockup V19, written up in the Go Home design system): wood wall, the candle logo, the styled QR with a hyphen-less room code, keystone windows that breathe and send waves, and the guest rail with fade-in arrivals. Players are household-object tokens instead of emojis everywhere. Next: the phone screens and game screens haven't been through a design review (they're marked "not reviewed" in the design system), then the house (3).

## 1. Thin Home
- [x] Lobby becomes Home: game list on the phone (host only), TV renders the running game
- [x] Return to Home when a game finishes (host's "Back home" button; no auto-return yet)
- [x] Home's own visual identity: cozy cabin — `app/components/home/home-tv.tsx`, tokens/keyframes in `app/globals.css` (`--home-*`, flame flicker, portal glow/sparks, twinkle). Real join card (actual QR, code, join URL), doors row (Ship door live, Lounge/locked decorative), guest list. Design history in `.planning/sketches/home/` (4 rounds — see that folder's README for what was tried and rejected before landing here).
- [x] Door-portal transition: TV plays a clip-path "iris" growing from the Ship door's screen position when the host starts Liar's Dice, instead of a hard cut — `app/room/[code]/page.tsx`. Client-side timing only (`PORTAL_MS`), no server involvement; the door's position is cached via a layout effect just before it unmounts, since the game's own render replaces Home and the ref would otherwise be gone by the time the transition effect runs.
- [x] Visually verify in a real browser: done with the redesign. The responsive breakpoint is gone: Home is a fixed 1920×1080 stage scaled to the screen (letterboxed on other aspect ratios). The portal still grows from the window's position.
- [x] Every phone screen outside a game (join, Home lobby, kicked, the mid-game joiner's wait) sits on Home's wood wall, like the TV (`HomeWallBackdrop`, narrower 112px planks). Kári's standing rule, in the design system.
- [x] Window hover removed: the TV never takes input and the host picks games on the phone, so hovering a window (which did nothing on click) only suggested a click. Fixed the breath snapping on/off: React was replacing the window SVG's contents on every re-render, so it couldn't transition; the markup is memoised now.
- [x] Home TV redesign from the design review: `home-tv.tsx` (stage + layout), `home-logo.tsx` ("gohome" in Gloock with the h as a candle, placed by measuring the glyph on a canvas), `styled-qr.tsx` (dots, rounded eyes, door; `qrcode-generator`, level H), `home-windows.ts` (keystone arch, Dock/Ship paintings, the "In construction" window), `home-field.tsx` (motes + a wave from a window every ~10 s; the window breathes light as its wave leaves), `guest-rail.tsx` (host pinned, newest first, fade-in arrival capsule with "is home", bottom fade when overflowing). Fonts via `next/font` in `app/layout.tsx`. Text selection is off on the TV.
- [x] The Lounge's slot is now Go Fish's real door (see `plans/games/go-fish.md`) — doors are driven by `games/rooms.ts`'s `ROOM_DOORS`, not hardcoded per-door JSX, so a third room just means one more entry.
- [ ] The "In construction" window is still purely decorative — no room/game exists behind it yet.

## 2. Lobby polish
- [x] "Let someone in" QR overlay for late joins: host's phone has a "Let someone in" toggle during a game; the TV shows a small join card (QR + code) in the top corner, over whatever room is running. Server state (`RoomState.joinOverlay`), since it's driven from a phone and shown on the TV; the server drops it automatically once a new seat joins, and on start/home. Late joiners wait for the next game (see `plans/platform.md`).
- [x] Avatars / character choice: originally 12 emoji characters (`shared/avatars.ts`). Picked on the join screen (random default so people who don't choose don't all ask for the same one), changeable from the phone's Home screen. Server keeps them unique while there are free ones (a taken pick on join is swapped for a free one; changing to a taken one is rejected with who has it); beyond 12 seats duplicates are allowed rather than refusing a join. Shown on the TV guest list, arrival toasts and in Go Fish. Real illustrated characters are a later investment — emoji are the placeholder.
- [x] Emoji characters replaced by player tokens (household objects on coloured chips, `app/components/player-token.tsx`; ids in `shared/avatars.ts`), on the TV, the phone and in Go Fish. Seats persisted with an old emoji get a free token on load.
- [x] 12 tokens now (added teacup, houseplant, umbrella, skeleton key), matching the old emoji count. The lobby still allows more seats than that; past 12, tokens repeat.
- [x] Arrival animation ("Sara is home"): the TV announces each new seat with a toast (avatar + "Sara is home") and guest chips pop in. Client-side only (`app/components/home/home-overlays.tsx`), diffed against the previous player list — people already there when the TV loads, and reconnects (same seat id), aren't announced. Shows over rooms too, not just Home.
- [x] At Home the toast is replaced by the guest rail's own arrival (row opens and fades in inside a capsule); the toast now only shows over game rooms.
- [x] Pick, then start (Kári's choice, 2026-10-18): the host's phone lists games ("Pick a game", painting + player range); tapping one opens its page with who's home against the range, How to play, and a Start that names why it can't start yet ("Needs 1 more player"). The pick is server state (`RoomState.pickedGameId`, host-only `pick` message, cleared on start), so guests see it as "Up next" with their own How to play button. Generic for every game: reads `GameInfo` min/max and `GAME_UI` blurb/Tutorial.
- [x] Rules for everyone: every in-game phone screen has a "?" in the top corner opening that game's tutorial.
- [ ] Kári to settle one flow and design that covers every game (after reviewing Go Fish's).
- [ ] Liar's Dice doesn't show avatars yet (Go Fish does) — small follow-up.

## 3. The house
- [ ] Rooms as categories, doors as the game picker
- [ ] Characters and per-room hosts
- [ ] Locked doors hinting at future content
- Decision: each room gets its own permanent aesthetic (not a player-selectable global theme). First room built: "the Ship" (pirate/Davy Jones), for dice/bluffing games. Sketch history in `.planning/sketches/the-ship/`.
