'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { HomeLogo } from '@/app/components/home/home-logo';
import { HomeWallBackdrop } from '@/app/components/home/home-wall-backdrop';
import { partyRoomUrl } from '@/lib/party-host';
import { generateRoomCode, normalizeRoomCode } from '@/lib/room-code';

const MAX_ATTEMPTS = 8;

const isOccupied = async (code: string) => {
  const res = await fetch(partyRoomUrl(code));
  return ((await res.json()) as { occupied: boolean }).occupied;
};

// Generates codes until one isn't already claimed by an existing room,
// instead of trusting the code space alone to avoid a collision (two
// unrelated groups would otherwise land in the same live session).
async function findFreeRoomCode(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateRoomCode();
    try {
      if (!(await isOccupied(code))) return code;
    } catch {
      return code; // occupancy check itself failed — better to risk a rare collision than block room creation entirely
    }
  }
  return generateRoomCode();
}

// The front door: this screen becomes the TV (create), or this phone joins
// a room that's already open (join).
export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    router.push(`/room/${await findFreeRoomCode()}`);
  };

  const join = async () => {
    const room = normalizeRoomCode(code);
    if (!room) return setError('Type the code shown on the TV');
    setChecking(true);
    setError(null);
    try {
      if (!(await isOccupied(room))) {
        setChecking(false);
        return setError(
          `No game called ${room} is open. Check the code on the TV.`
        );
      }
    } catch {
      // can't check right now; let the join page try
    }
    router.push(`/join/${room}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-[var(--home-text)]">
      <HomeWallBackdrop />
      {/* a TV across the room gets everything larger */}
      <div className="flex w-full flex-col items-center min-[1600px]:[zoom:1.6]">
        <div className="origin-center scale-[0.7] sm:scale-100">
          <HomeLogo />
        </div>

        <div className="mt-6 flex w-full max-w-3xl flex-col-reverse gap-5 sm:mt-14 sm:flex-row">
          <section className="flex flex-1 flex-col rounded-3xl border border-[var(--home-border)] bg-[color-mix(in_srgb,var(--home-surface)_88%,transparent)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Host a game night
            </h2>
            <p className="mt-2 flex-1 text-[var(--home-text-muted)]">
              Open this on the TV. It shows a code, and everyone joins on their
              phone.
            </p>
            <button
              onClick={create}
              disabled={creating}
              className="mt-6 w-full home-gold-fill rounded-xl py-4 text-xl font-bold transition hover:brightness-110 disabled:opacity-60"
            >
              {creating ? 'Opening the house…' : 'Create game'}
            </button>
          </section>

          <section className="flex flex-1 flex-col rounded-3xl border border-[var(--home-border)] bg-[color-mix(in_srgb,var(--home-surface)_88%,transparent)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Join a game
            </h2>
            <p className="mt-2 text-[var(--home-text-muted)]">
              Type the code shown on the TV.
            </p>
            <form
              className="mt-6 flex flex-1 flex-col justify-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                join();
              }}
            >
              <input
                id="room-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Code"
                aria-label="Room code"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={12}
                className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-4 text-center font-[family-name:var(--font-display)] text-2xl font-bold tracking-widest text-[var(--home-gold)] placeholder-[var(--home-text-muted)] placeholder:font-[family-name:var(--font-read)] placeholder:text-xl placeholder:font-normal placeholder:tracking-normal focus:border-[var(--home-gold)] focus:outline-none"
              />
              {error && (
                <p className="text-sm text-[var(--home-ember)]">{error}</p>
              )}
              <button
                type="submit"
                disabled={checking || !code.trim()}
                className="w-full rounded-xl border-2 border-[var(--home-brass)] bg-[color-mix(in_srgb,var(--home-surface)_88%,transparent)] py-4 text-xl font-bold text-[var(--home-gold)] transition hover:border-[var(--home-gold)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--home-gold)]"
              >
                {checking ? 'Knocking…' : 'Join game'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
