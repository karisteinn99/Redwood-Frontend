'use client';

import dynamic from 'next/dynamic';

// Dynamically import the MapLibre component and disable SSR
const MapLibreMap = dynamic(() => import('../components/maplibre-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        <p className="text-lg text-white">Loading map...</p>
      </div>
    </div>
  ),
});

export default function GameSessionPage() {
  return <MapLibreMap />;
}
