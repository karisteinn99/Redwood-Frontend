'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { generateRoomCode } from '@/lib/room-code';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/room/${generateRoomCode()}`);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <p className="text-2xl text-white/50">Welcome home…</p>
    </div>
  );
}
