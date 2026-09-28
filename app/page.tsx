'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { partyRoomUrl } from '@/lib/party-host';
import { generateRoomCode } from '@/lib/room-code';

const MAX_ATTEMPTS = 8;

// Generates codes until one isn't already claimed by an existing room,
// instead of trusting the code space alone to avoid a collision (two
// unrelated groups would otherwise land in the same live session).
async function findFreeRoomCode(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateRoomCode();
    try {
      const res = await fetch(partyRoomUrl(code));
      const { occupied } = (await res.json()) as { occupied: boolean };
      if (!occupied) return code;
    } catch {
      return code; // occupancy check itself failed — better to risk a rare collision than block room creation entirely
    }
  }
  return generateRoomCode();
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    findFreeRoomCode().then((code) => {
      if (!cancelled) router.replace(`/room/${code}`);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <p className="text-2xl text-white/50">Welcome home…</p>
    </div>
  );
}
