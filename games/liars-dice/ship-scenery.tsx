// The Ship's persistent backdrop — hull ribs, a porthole, a swinging
// lantern. Lives behind every screen of this game (see .planning/sketches/
// the-ship for the design source). Kept subtle enough that dice/text stay
// fully legible: this is a functional game screen, not a mood board.
export function ShipScenery() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[var(--ship-bg)]">
      <svg viewBox="0 0 1000 562" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="ship-wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a120c" />
            <stop offset="100%" stopColor="#3a2a1a" />
          </linearGradient>
          <radialGradient id="ship-lantern-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#e8a33d" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e8a33d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ship-sea-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4de8c2" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#1c6a55" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0a1210" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ship-vignette" cx="50%" cy="46%" r="72%">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
        </defs>

        <path d="M -40,0 C 90,140 90,420 -40,562 L 90,562 C 190,420 190,140 90,0 Z" fill="url(#ship-wood)" opacity="0.85" />
        <path d="M 1040,0 C 910,140 910,420 1040,562 L 910,562 C 810,420 810,140 910,0 Z" fill="url(#ship-wood)" opacity="0.85" />

        <circle cx="860" cy="90" r="70" fill="url(#ship-sea-glow)" />
        <circle cx="860" cy="90" r="56" fill="none" stroke="#5c4326" strokeWidth="10" />
        <circle cx="860" cy="90" r="56" fill="none" stroke="#8a6a3c" strokeWidth="2" />

        <rect width="1000" height="562" fill="url(#ship-vignette)" />
      </svg>

      <div className="animate-lantern-swing absolute top-0 left-1/2 -translate-x-1/2">
        <div className="mx-auto h-14 w-0.5 bg-[#4a3a24]" />
        <div
          className="relative -mt-1 h-9 w-9 rounded-full"
          style={{ background: 'radial-gradient(circle, #ffd27a, #e8a33d 55%, transparent 75%)' }}
        >
          <div className="absolute inset-2 rounded-sm border border-[#8a6a3c] bg-[#2a2015]" />
        </div>
      </div>
    </div>
  );
}
