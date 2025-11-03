import { postAnswer } from '@shared/api';
import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({
  questionIndex,
  onAnswerSubmit,
}: {
  questionIndex: number;
  onAnswerSubmit: (distanceKm: number) => void;
}) {
  useMapEvents({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async click(e: any) {
      const res = await postAnswer(questionIndex + 1, {
        lat: e.latlng.lat,
        long: e.latlng.lng, // Fixed 'long' to 'lng'
      });

      // Check if the response contains 'distance_km'
      if ('distance_km' in res) {
        onAnswerSubmit(res.distance_km);
      } else if ('error' in res) {
        console.error('Error in postAnswer:', res.error);
      } else {
        console.error('Unexpected response:', res);
      }
    },
  });
  return null;
}
