# Go Home — Plan

Order matters: prove the multiplayer/game architecture first, the house comes after.

**Current focus:** Two real games now exist — Liar's Dice (the Ship, full visual identity) and Go Fish (generic theme, proves the `GameDefinition` interface generalizes: no elimination, no bluffing/reveal-pause mechanic). The demo test-fixture game is gone. Home's door row is now data-driven (`games/rooms.ts`) instead of hardcoded to one game, so Go Fish took over the old decorative "Lounge" slot. Next: Go Fish's own room identity (deliberately deferred, same precedent Liar's Dice followed), lobby polish, the house, or remaining platform robustness (kick/transfer host, pruning stale seats).

| Area | File | Covers |
| --- | --- | --- |
| Platform | [plans/platform.md](plans/platform.md) | game interface, robustness, deploy |
| Home | [plans/home.md](plans/home.md) | thin Home, lobby polish, the house |
| Games | [plans/games/](plans/games/) | one file per game: [liars-dice.md](plans/games/liars-dice.md), [go-fish.md](plans/games/go-fish.md) |

Rules: update the relevant file in the same change as the work. Deferred or dropped items stay, marked with a reason. Finished bounded efforts can move to `plans/done/`.
