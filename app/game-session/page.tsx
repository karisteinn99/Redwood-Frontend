'use client';

import dynamic from 'next/dynamic';

// Dynamically import the page content and disable SSR
const GameSessionPageContent = dynamic(() => import('./game-session-content'), {
  ssr: false, // Disable server-side rendering
});

export default function GameSessionPage() {
  return <GameSessionPageContent />;
}
