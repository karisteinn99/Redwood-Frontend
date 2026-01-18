import Image from 'next/image';
import MenuPage from './components/menu-page';

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Earth Animated Background with fade to black at bottom */}
      <div className="absolute inset-0 z-0 h-[150vh]">
        <Image
          src="/earth-animated.png"
          alt="Earth animated from space"
          fill
          className="h-full w-full object-cover object-top opacity-90"
          style={
            {
              imageRendering: 'crisp-edges',
            } as React.CSSProperties
          }
          priority
          quality={95}
          sizes="100vw"
        />
        {/* Fade to black at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      {/* Rapid darkening overlay that starts immediately on scroll */}
      <div className="pointer-events-none absolute inset-0 z-5">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-black/40 via-black/60 to-black/90" />
      </div>

      {/* Extended content area beyond background */}
      <div className="absolute top-[150vh] right-0 left-0 z-0 min-h-screen bg-black" />

      {/* Page Content */}
      <div className="relative z-10">
        <MenuPage />
      </div>
    </div>
  );
}
