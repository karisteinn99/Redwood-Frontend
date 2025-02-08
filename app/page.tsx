'use client';

import Link from 'next/link';
import MapAnimated from './components/MapAnimated';

export default function Home() {
  return (
    <div className="relative grid h-screen w-screen place-items-center overflow-hidden bg-gray-100">
      <MapAnimated />
      <div className="z-10 flex flex-col items-center">
        <Link
          href={'/game-session'}
          className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition duration-200 hover:bg-blue-600"
        >
          Start game
        </Link>
      </div>
    </div>
  );
}
