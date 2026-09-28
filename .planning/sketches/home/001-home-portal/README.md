---
sketch: 001
name: home-portal
question: "What does Home's own identity look like (distinct from any room), and does 'open a door, portal into the Ship' work as a transition?"
winner: null
tags: [home, lobby, portal, transition]
---

# Sketch 001: Home & the Door Portal

## Design Question
Home needs its own fixed identity that isn't any specific game's room — reusing the warmed tavern palette from sketch 002 as a generic "welcome" feeling. And: does opening a door as a literal portal into a differently-themed room (the Ship) actually read well, or does it feel gimmicky?

## How to View
```
open .planning/sketches/home/001-home-portal/index.html
```

**Click the glowing door** ("The Ship") on either variant — a circular portal expands outward from the door itself, revealing the Ship's world underneath. Hit "↺ Reset to Home" to close it and try again, or click it from a different scroll position to see the portal originate from wherever the door actually is on screen (it's computed from the door's real position, not hardcoded).

## Variants
- **A: Warm Hallway** — QR and room code up top, a row of three doors below (Lounge / Ship / a locked "???"), guest nameplates at the bottom.
- **B: Grand Foyer** — a subtle hearth glow anchors the bottom of the frame, doors are the visual centerpiece with the welcome text above and QR below.

Both variants use the exact same portal mechanic and the same simplified Ship interior on the other side (a condensed version of the Ship's scenery (the-ship/001-pirate-scenery)) — only the foyer composition differs.

## What to Look For
- Does Home read as clearly "a place," separate from the Ship, when you're only looking at the foyer layer?
- Does the glow under the Ship door read as inviting/alive *before* you click it?
- Does the portal-open transition feel magical, or too slow/fast? (It's ~1.15s, easy to tune.)
- The "???" locked door and the plain "Lounge" door are there on purpose — does having other doors present (even unbuilt) help sell "this is a house with more rooms," per the original product brief about locked doors hinting at future content?
- A: Warm Hallway vs B: Grand Foyer — which foyer composition do you actually want to live with, independent of the portal effect itself?
