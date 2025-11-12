import Link from 'next/link';
import Button from './button';

const MenuPage = () => {
  return (
    <div className="bg-space relative min-h-screen w-full overflow-hidden">
      {/* Background Earth Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=2070&auto=format&fit=crop"
          alt="Earth from space"
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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Game Title */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-6xl font-bold text-white drop-shadow-lg md:text-7xl">
            Where?
          </h1>
          <p className="text-neutral-light/90 text-xl italic drop-shadow-md">
            Seek. Locate. Conquer.
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Button asChild variant="primary" className="min-w-48">
            <Link href="/game-session">Play Game</Link>
          </Button>
          <Button asChild variant="outline" className="min-w-48">
            <Link href="/leaderboards">Leaderboards</Link>
          </Button>
        </div>

        {/* Additional decorative elements */}
        <div className="mt-16 text-center">
          <div className="text-neutral-light/60 flex items-center justify-center space-x-8">
            <div className="bg-neutral-light/30 h-px w-16"></div>
            <p className="text-sm tracking-wider uppercase">
              Begin Your Journey
            </p>
            <div className="bg-neutral-light/30 h-px w-16"></div>
          </div>
        </div>
      </div>

      {/* Company Credit - Bottom Right */}
      <div className="absolute right-4 bottom-4 z-20">
        <p className="text-neutral-light/50 text-xs tracking-wide">
          Hail-Mary Projects
        </p>
      </div>
    </div>
  );
};

export default MenuPage;
