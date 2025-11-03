'use client';

import dynamic from 'next/dynamic';

// Dynamically import the WorldMap component and disable SSR
const WorldMap = dynamic(() => import('./world-map'), { ssr: false });

export default function GameSessionPage() {
  return <WorldMap />;
}
