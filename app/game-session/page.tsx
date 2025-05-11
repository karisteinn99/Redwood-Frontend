'use client';

import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS (required)
import { useState } from 'react';

// function MapClickHandler({
//   questionIndex,
//   onAnswerSubmit,
// }: {
//   questionIndex: number;
//   onAnswerSubmit: (distanceKm: number) => void;
// }) {
//   useMapEvents({
//     async click(e) {
//       const res = await postAnswer(questionIndex + 1, {
//         lat: e.latlng.lat,
//         long: e.latlng.lng, // Fixed 'long' to 'lng'
//       });
//       if ('distance_km' in res && res.distance_km !== undefined) {
//         onAnswerSubmit(res.distance_km);
//       } else {
//         if ('error' in res) {
//           console.error('Error in postAnswer:', res.error);
//         }
//       }
//     },
//   });
//   return null;
// }

export default function WorldMap() {
  const [questions, setQuestions] = useState<
    { id: number; question: string }[]
  >([]);
  const [questionIndex, setQuestionIndex] = useState(0); // Current question index
  const [totalDistance, setTotalDistance] = useState(0); // Total distance accumulated

  // const router = useRouter(); // Initialize Next.js router
  // if (window === undefined) return null; // Check if window is defined

  // // Fetch questions on mount
  // useEffect(() => {
  //   getQuestions().then((data) => {
  //     setQuestions(data);
  //   });
  // }, []);

  // // Function to handle answering a question
  // const handleAnswerSubmit = (distanceKm: number) => {
  //   alert(`Deviation from correct co-ordinates: ${distanceKm.toFixed(2)}km`);

  //   // Update total distance
  //   setTotalDistance((prevTotal) => prevTotal + distanceKm);

  //   // Go to the next question or finish the game
  //   if (questionIndex + 1 < questions.length) {
  //     setQuestionIndex((prevIndex) => prevIndex + 1);
  //   } else {
  //     alert(
  //       `Thank you for playing!\n
  //        Total deviation from correct co-ordinates: ${totalDistance.toFixed(2)}km. `
  //     );
  //     router.push('/'); // Redirect to home URL after the final alert
  //   }
  // };

  return <div>Some stuff is rendered here yo</div>;
  return (
    <>
      {/* Inline style tag to handle dragging cursor */}
      <style>
        {`
          body.leaflet-dragging {
            cursor: grabbing; /* Change cursor to grabbing during dragging */
          }

          .leaflet-container {
            cursor: crosshair; /* Default cursor for clicking on the map */
          }

          .question-box {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 18px;
            z-index: 1000; /* Ensure it appears above the map */
          }
        `}
      </style>

      {/* <div className="relative h-screen w-screen overflow-hidden">
        {questions.length > 0 && questionIndex < questions.length && (
          <div className="question-box">
            {questions[questionIndex].question}
          </div>
        )}

        <MapContainer
          center={[0, 0]} // Center the map at [latitude, longitude]
          zoom={2} // Set default zoom level
          maxZoom={10} // Limit zoom level to avoid excessive duplication
          minZoom={2} // Prevent zooming out too far
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler
            questionIndex={questionIndex}
            onAnswerSubmit={handleAnswerSubmit}
          />
        </MapContainer>
      </div> */}
    </>
  );
}
