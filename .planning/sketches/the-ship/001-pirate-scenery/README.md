---
sketch: 001
name: pirate-scenery
question: "For 'the Ship' room: how much literal background scenery vs. lighting/color alone, and does blending warm lantern light against cold teal glow read better than one note of cyan?"
winner: null
tags: [reveal, tv, theme, pirate, scenery]
---

# Sketch 001: The Ship — Scenery Depth

## Design Question
Two things at once: (1) does blending a warm amber lantern glow against the cold teal ghost-light read richer than the single-cyan feel from sketch 002? (2) how far should "art in the background" go — literal objects (ribs, a porthole, a lantern) vs. an abstract lighting treatment — before it risks fighting with the actual game content for attention?

Framed as **the Ship**, one room within Home for dice/bluffing games — not a proposal for the whole app's global skin.

## How to View
```
open .planning/sketches/the-ship/001-pirate-scenery/index.html
```

Same scripted round as sketches 001–002. Use **Director → Play full sequence** on both — the immersive variant's lantern swing and sea-glow pulse are genuinely different in motion than in a screenshot.

## Variants
- **A: Warm/Cool Blend (minimal)** — no literal objects at all, just an amber wash in one corner blended against a teal wash in the other, plus a vignette. Content stays fully dominant.
- **B: Ship's Hold (full scenery)** — actual hull ribs framing both edges, a porthole with a pulsing sea-glow, rope netting in a corner, and a lit lantern swinging gently overhead. The warm/cool blend now comes from a real light source instead of an abstract gradient.

## What to Look For
- Does B ever compete with the dice board / verdict text for attention, especially once real (longer, messier) player names are in there?
- Does A feel like it's missing something, or is it actually enough — "moody lighting" rather than "scenery" might be the more sustainable pattern across dozens of future screens, since B is meaningfully more CSS/SVG per screen to build and maintain.
- Is the lantern swing a nice touch or a distraction once you've watched it a few times?
- Remember: I can't generate real painted illustration yet (no image-gen tool in this environment) — B is the ceiling of what's achievable in pure CSS/SVG. If B still doesn't feel rich enough, that's a signal real commissioned/generated art is the next real investment, not more CSS.
