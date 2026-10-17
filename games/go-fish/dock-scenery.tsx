// The Dock's persistent backdrop — sunset sky, a far tree line, dark lake
// water with drifting ripples, the end of a wooden dock and a floating
// bobber. Same rule as the Ship's scenery: subtle enough that cards and
// names stay fully legible, since this sits behind a functional game screen.
export function DockScenery() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--dock-water-deep)]">
      <div
        className="absolute inset-x-0 top-0 h-[52%]"
        style={{
          background:
            'linear-gradient(180deg, var(--dock-sky-top) 0%, var(--dock-sky-mid) 58%, var(--dock-sky-low) 100%)',
        }}
      />
      {/* setting sun, half under the horizon */}
      <div
        className="absolute top-[52%] left-[68%] h-[22vh] w-[22vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, #ffe2a8 0%, var(--dock-sun) 45%, rgba(232,135,90,0) 72%)',
        }}
      />
      {/* far shore */}
      <svg
        viewBox="0 0 1000 60"
        preserveAspectRatio="none"
        className="absolute top-[calc(52%-5vh)] h-[5.2vh] w-full"
      >
        <path
          d="M0,60 L0,38 Q40,20 80,34 T170,30 Q210,8 250,28 T340,32 Q380,14 430,30 T540,26 Q590,6 640,30 T740,34 Q790,16 840,30 T930,28 Q970,18 1000,30 L1000,60 Z"
          fill="#141a33"
        />
      </svg>
      <div
        className="absolute inset-x-0 bottom-0 h-[48%]"
        style={{
          background:
            'linear-gradient(180deg, var(--dock-water) 0%, var(--dock-water-deep) 100%)',
        }}
      />
      {/* sun's reflection on the water */}
      <div
        className="absolute top-[52%] left-[68%] h-[20%] w-[10vh] -translate-x-1/2 opacity-40 blur-md"
        style={{
          background: 'linear-gradient(180deg, var(--dock-sun), transparent)',
        }}
      />
      {[58, 66, 74, 83].map((top, i) => (
        <span
          key={top}
          className="animate-ripple absolute h-px rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(246,238,227,0.45), transparent)',
            top: `${top}%`,
            left: `${12 + ((i * 23) % 60)}%`,
            width: `${10 + i * 3}%`,
            animationDelay: `${i * 0.9}s`,
          }}
        />
      ))}
      {/* bobber */}
      <div className="animate-bob absolute top-[70%] left-[22%] flex flex-col items-center">
        <span className="h-2.5 w-2.5 rounded-t-full bg-[var(--dock-card-red)]" />
        <span className="h-2.5 w-2.5 rounded-b-full bg-[var(--dock-card)]" />
      </div>
      {/* end of the dock, bottom edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-[7vh] border-t-4 border-[#3d2a1b]"
        style={{
          background:
            'repeating-linear-gradient(90deg, var(--dock-wood) 0px, var(--dock-wood-light) 3px, var(--dock-wood) 6px, var(--dock-wood) 110px, #3d2a1b 110px, #3d2a1b 113px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}

// Phone-sized version: just the colors, no scenery competing with a hand of
// cards on a small screen. Full-bleed so it covers the platform join page's
// generic wrapper, same as the Ship's ShipBackdrop.
export function DockBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          'linear-gradient(180deg, var(--dock-sky-top) 0%, var(--dock-sky-mid) 30%, var(--dock-water) 55%, var(--dock-water-deep) 100%)',
      }}
    />
  );
}
