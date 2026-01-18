'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import { getQuestions, postAnswer } from '@shared/api';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Map, { MapLayerMouseEvent } from 'react-map-gl/maplibre';

interface Question {
  id: number;
  question: string;
}

export default function MapLibreMap() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState<{
    distance: number;
    userLat: number;
    userLng: number;
  } | null>(null);

  const router = useRouter();

  // Fetch questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const fetchedQuestions = await getQuestions();
        if (Array.isArray(fetchedQuestions)) {
          setQuestions(fetchedQuestions);
        } else {
          console.error('Failed to fetch questions:', fetchedQuestions);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleMapClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      if (gameCompleted || currentQuestionIndex >= questions.length) {
        return;
      }

      const { lng, lat } = event.lngLat;
      const currentQuestion = questions[currentQuestionIndex];

      try {
        const result = await postAnswer(currentQuestion.id, {
          lat: lat,
          long: lng,
        });

        if ('distance_km' in result) {
          const distance = result.distance_km;
          setCurrentAnswer({
            distance,
            userLat: lat,
            userLng: lng,
          });
          setTotalDistance((prev) => prev + distance);

          // Show answer for 3 seconds, then move to next question
          setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex((prev) => prev + 1);
              setCurrentAnswer(null);
            } else {
              setGameCompleted(true);
            }
          }, 3000);
        } else {
          console.error('Error in postAnswer:', result.error);
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
      }
    },
    [currentQuestionIndex, questions, gameCompleted]
  );

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setTotalDistance(0);
    setGameCompleted(false);
    setCurrentAnswer(null);
  };

  const goToMenu = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
          <p className="text-lg text-white">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h2 className="mb-4 text-2xl">No questions available</h2>
          <button
            onClick={goToMenu}
            className="rounded-lg bg-blue-500 px-6 py-2 hover:bg-blue-600"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="relative h-screen w-full">
      {/* Question Display Overlay */}
      <div className="absolute top-0 right-0 left-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="mx-auto max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-4 h-2 w-full rounded-full bg-gray-700">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Question Counter */}
          <div className="mb-2 text-sm text-white/80">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>

          {/* Current Question */}
          <div className="rounded-lg bg-black/60 p-4 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              {currentQuestion?.question}
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Click on the map to guess the location
            </p>
          </div>
        </div>
      </div>

      {/* Answer Feedback */}
      {currentAnswer && (
        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="rounded-lg bg-black/90 p-6 text-center text-white backdrop-blur-sm">
            <h3 className="mb-2 text-xl font-bold">
              {currentAnswer.distance < 100
                ? 'Excellent!'
                : currentAnswer.distance < 500
                  ? 'Good!'
                  : currentAnswer.distance < 1000
                    ? 'Not bad!'
                    : 'Keep trying!'}
            </h3>
            <p className="text-lg">
              You were <strong>{Math.round(currentAnswer.distance)} km</strong>{' '}
              away
            </p>
            <p className="mt-2 text-sm text-white/80">
              {currentQuestionIndex < questions.length - 1
                ? 'Next question in 3 seconds...'
                : 'Game completed!'}
            </p>
          </div>
        </div>
      )}

      {/* Game Completed Overlay */}
      {gameCompleted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90">
          <div className="mx-4 max-w-md rounded-lg bg-white p-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-800">
              Game Complete! 🎉
            </h2>
            <div className="mb-6">
              <div className="mb-2 text-6xl font-bold text-blue-500">
                {Math.round(totalDistance)}
              </div>
              <div className="text-gray-600">Total Distance (km)</div>
              <div className="mt-2 text-sm text-gray-500">
                Average: {Math.round(totalDistance / questions.length)} km per
                question
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={resetGame}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
              >
                Play Again
              </button>
              <button
                onClick={goToMenu}
                className="flex-1 rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MapLibre Map */}
      <Map
        initialViewState={{
          latitude: 20,
          longitude: 0,
          zoom: 2,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://demotiles.maplibre.org/style.json"
        onClick={handleMapClick}
        cursor={gameCompleted ? 'default' : 'crosshair'}
        attributionControl={false}
        maxZoom={10}
        minZoom={1}
      />

      {/* Score Display */}
      <div className="absolute right-6 bottom-6 z-10">
        <div className="rounded-lg bg-black/80 px-4 py-2 text-white backdrop-blur-sm">
          <div className="text-sm text-white/80">Total Distance</div>
          <div className="text-xl font-bold">
            {Math.round(totalDistance)} km
          </div>
        </div>
      </div>
    </div>
  );
}
