'use client';

import { fetchTestMessage } from '../shared/api';
// pages/index.tsx
import { useState } from 'react';

export default function Home() {
  const [response, setResponse] = useState<{
    message: string;
    status: string;
  } | null>(null);

  const handleButtonClick = async () => {
    const data = await fetchTestMessage();
    setResponse(data);
  };

  return (
    <div className="grid h-screen w-screen place-items-center bg-gray-100">
      <div className="text-center">
        <button
          onClick={handleButtonClick}
          className="rounded-md bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg transition duration-200 hover:bg-blue-600"
        >
          Testing endpoint connection
        </button>
        {response && (
          <div className="mt-6 rounded-lg border p-6 shadow-md">
            <p className="text-xl font-semibold">
              {response.status.toUpperCase()}
            </p>
            <p className="mt-2 text-lg">{response.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
