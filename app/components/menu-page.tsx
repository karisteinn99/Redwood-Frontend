import Link from 'next/link';
import Button from './button';
import GlassCard from './glass-card';

const MenuPage = () => {
  return (
    <div className="animate-fade-in">
      {/* Top Section - Main Game Entry */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4">
        {/* Game Title */}
        <div className="mb-12 text-center">
          <GlassCard className="rounded-3xl px-8 py-6">
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-white drop-shadow-2xl md:text-7xl">
              Where?
            </h1>
            <p className="text-2xl font-light tracking-wide text-white/95 italic drop-shadow-lg">
              Seek. Locate. Conquer.
            </p>
          </GlassCard>
        </div>

        {/* Main Play Button */}
        <div className="mb-12">
          <Button
            asChild
            variant="primary"
            className="border border-blue-400/30 bg-blue-600/90 px-12 py-6 text-xl shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-blue-500/95"
          >
            <Link href="/game-session">Play Game</Link>
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div className="text-center">
          <div className="flex flex-col items-center space-y-2 text-white/70">
            <p className="text-sm font-medium tracking-wider uppercase">
              Discover More
            </p>
            <div className="animate-bounce">
              <svg
                className="h-6 w-6 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          {/* Coming Soon Title */}
          <div className="mb-16">
            <h2 className="mb-4 text-5xl font-bold text-white drop-shadow-2xl md:text-6xl">
              Coming Soon
            </h2>
            <p className="text-xl font-light text-white/80 drop-shadow-lg md:text-2xl">
              Exciting features on the horizon
            </p>
          </div>

          {/* Feature Grid - Mobile responsive, 3 columns on desktop */}
          <div className="mb-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Leaderboards */}
            <GlassCard hover className="rounded-2xl p-6">
              <div className="mb-4 text-4xl">🏆</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Global Leaderboards
              </h3>
              <p className="text-sm text-white/70">
                Compete with players worldwide and climb the rankings
              </p>
            </GlassCard>

            {/* Statistics */}
            <GlassCard hover className="rounded-2xl p-6">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Player Statistics
              </h3>
              <p className="text-sm text-white/70">
                Track your progress with detailed analytics
              </p>
            </GlassCard>

            {/* Tournaments */}
            <GlassCard hover className="rounded-2xl p-6">
              <div className="mb-4 text-4xl">⚔️</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Tournaments
              </h3>
              <p className="text-sm text-white/70">
                Join competitive events and win prizes
              </p>
            </GlassCard>

            {/* Multiplayer */}
            <GlassCard hover className="rounded-2xl p-6">
              <div className="mb-4 text-4xl">👥</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Multiplayer Battles
              </h3>
              <p className="text-sm text-white/70">
                Challenge friends in real-time matches
              </p>
            </GlassCard>

            {/* Custom Maps */}
            <GlassCard hover className="rounded-2xl p-6">
              <div className="mb-4 text-4xl">🗺️</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Custom Maps
              </h3>
              <p className="text-sm text-white/70">
                Explore themed maps and special regions
              </p>
            </GlassCard>

            {/* Achievements */}
            <GlassCard hover className="rounded-2xl p-6">
              <div className="mb-4 text-4xl">🎖️</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Achievements
              </h3>
              <p className="text-sm text-white/70">
                Unlock badges and special rewards
              </p>
            </GlassCard>
          </div>

          {/* Newsletter Signup */}
          <GlassCard className="rounded-2xl p-8">
            <h3 className="mb-4 text-2xl font-semibold text-white">
              Stay Updated
            </h3>
            <p className="mb-6 text-white/80">
              Be the first to know when these features launch
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white placeholder-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <Button className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700">
                Notify Me
              </Button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Company Credit - Bottom Right */}
      <div className="fixed right-6 bottom-6 z-30">
        <p className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium tracking-wide text-white/60 backdrop-blur-sm">
          Hail-Mary Projects
        </p>
      </div>
    </div>
  );
};

export default MenuPage;
