# The Dock — Design Notes

Room for Go Fish. No HTML sketch round yet — the identity went straight into code (`games/go-fish/dock-scenery.tsx`, `card.tsx`, `--dock-*` in `app/globals.css`), so this file records the reasoning instead. See `../MANIFEST.md` for the room-split decision.

## Direction
- **A lake at sunset, seen from the end of a dock.** Go Fish is a fishing game, so water is the obvious setting — but the Ship already owns "the sea at night" (cold teal, ghostly). The Dock is the warm, calm counterpart: freshwater, golden hour, a bobber instead of a lantern.
- **Palette:** indigo → plum → coral sky over deep lake-blue water, sun-bleached planks. Coral is the active/turn accent (the Ship's teal, inverted warm); sun-gold is reserved for the winner — mirrors the Ship's teal-vs-lantern split so the two rooms read as siblings without looking alike.
- **Cards are the hero.** Cream faces, big rank, a small fish pip — legible from across a room. Backs are wave-patterned in the lake colors. Suits aren't modeled in the game, so faces don't pretend to have them (red for aces/faces is just variety).
- **Phone stays plain:** colors only, no scenery, so a hand of cards has the screen to itself.

## Open
- Real illustrated scenery (like the Ship, a future investment).
- A sketch round if the direction needs revisiting.
