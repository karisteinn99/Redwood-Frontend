'use client';

import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

import MapClickHandler from '../utils/map-click-handler';

export default function GameSessionPageContent() {
  const [distance, setDistance] = useState<number | null>(null);

  return (
    <div className="relative h-screen w-screen">
      {/* Wrap the map and handlers in MapContainer */}
      <MapContainer
        center={[51.505, -0.09]} // Default center of the map
        zoom={13} // Default zoom level
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler
          questionIndex={0} // Example question index
          onAnswerSubmit={(distanceKm) => setDistance(distanceKm)}
        />
      </MapContainer>

      {/* Display the distance if available */}
      {distance !== null && (
        <div className="absolute left-4 top-4 bg-white p-4 shadow-md">
          <p className="text-lg font-semibold">Distance: {distance} km</p>
        </div>
      )}
    </div>
  );
}
