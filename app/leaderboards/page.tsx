'use client';

export default function Leaderboards() {
  return (
    <div className="bg-space relative min-h-screen w-full overflow-hidden">
      {/* Background Earth Image - Different view */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=2070&auto=format&fit=crop&crop=focalpoint&fp-x=0.3&fp-y=0.7"
          alt="Earth from space - Different view"
          className="h-full w-full object-cover opacity-80"
          style={
            {
              imageRendering: 'crisp-edges',
            } as React.CSSProperties
          }
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-center text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
            Leaderboards
          </h1>
          <div className="bg-space-lighter/80 rounded-lg p-8 shadow-xl backdrop-blur-sm">
            <p className="text-neutral-light text-center text-xl">
              Leaderboards coming soon...
            </p>
            <p className="text-neutral-light/70 mt-4 text-center text-sm">
              Check back later to see how you rank against other players!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
