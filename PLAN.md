# Go Home — Plan

Order matters: prove the multiplayer/game architecture first, the house comes after.

**Current focus:** Two real games, each in its own room — Liar's Dice on the Ship, Go Fish on the Dock. Lobby polish is done (avatars, "Sara is home" arrivals, a "Let someone in" QR overlay for late joiners), and so is the remaining platform robustness (host kick/transfer, pruning stale lobby seats, mid-game joiners wait for the next game). Next: the house (rooms as categories, doors as the picker, characters), visually verifying Home's responsive fit/portal timing, or a third room behind the locked door.

| Area | File | Covers |
| --- | --- | --- |
| Platform | [plans/platform.md](plans/platform.md) | game interface, robustness, deploy |
| Home | [plans/home.md](plans/home.md) | thin Home, lobby polish, the house |
| Games | [plans/games/](plans/games/) | one file per game: [liars-dice.md](plans/games/liars-dice.md), [go-fish.md](plans/games/go-fish.md) |

Rules: update the relevant file in the same change as the work. Deferred or dropped items stay, marked with a reason. Finished bounded efforts can move to `plans/done/`.
