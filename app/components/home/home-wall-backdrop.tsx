// Home's wood-panelled wall (see home-tv.tsx) as a full-bleed phone
// backdrop, for every phone screen that isn't inside a game. Narrower planks
// than the TV's 172px so a phone shows a few of them, not two.

export function HomeWallBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#241e17]" aria-hidden="true">
      <div className="home-wall absolute inset-0 [--plank:112px]" />
      <svg className="absolute inset-0 h-full w-full opacity-80 mix-blend-overlay">
        <filter id="home-woodgrain-phone" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0034 0.11" numOctaves={4} seed={7} />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.38  0 0 0 0 0.22  0 0 0 1.4 -0.45" />
        </filter>
        <rect width="100%" height="100%" filter="url(#home-woodgrain-phone)" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_60%_at_20%_0%,rgba(240,151,60,0.14),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_55%,rgba(0,0,0,0.5))]" />
    </div>
  );
}
