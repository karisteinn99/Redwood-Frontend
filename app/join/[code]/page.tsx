'use client';

import { use, useEffect, useState } from 'react';

import { normalizeRoomCode } from '@/lib/room-code';
import { usePartyRoom } from '@/lib/use-party-room';
import type { HelloMessage } from '@shared/party-types';
import { GAME_UI } from '@/games/ui';

interface Saved {
  name: string;
  token: string;
}

const storageKey = (code: string) => `gohome:${code}`;

const load = (code: string): Saved | null => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(code)) ?? 'null');
  } catch {
    return null;
  }
};

const save = (code: string, value: Saved) => {
  try {
    localStorage.setItem(storageKey(code), JSON.stringify(value));
  } catch {
    // storage unavailable; reconnect just creates a new seat
  }
};

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeRoomCode(use(params).code);
  const [name, setName] = useState('');
  const [hello, setHello] = useState<HelloMessage | null>(null);
  const [tutorialGameId, setTutorialGameId] = useState<string | null>(null);
  const { state, you, gameView, lastError, connected, send } = usePartyRoom(code, hello);

  useEffect(() => {
    const saved = load(code);
    if (!saved) return;
    setName(saved.name);
    setHello({ type: 'hello', role: 'player', name: saved.name, token: saved.token });
  }, [code]);

  useEffect(() => {
    if (you && hello?.role === 'player') save(code, { name: hello.name, token: you.token });
  }, [code, you, hello]);

  const join = () => {
    if (!name.trim()) return;
    setHello({ type: 'hello', role: 'player', name: name.trim(), token: load(code)?.token });
  };

  const me = state?.players.find((p) => p.id === you?.playerId);

  if (!hello || !me) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 px-8 text-white">
        <p className="mb-2 text-sm tracking-widest text-white/40 uppercase">Come inside</p>
        <p className="mb-10 text-5xl font-bold tracking-widest">{code}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="Your name"
          maxLength={20}
          autoFocus
          className="mb-4 w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-center text-xl placeholder-white/30 focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={join}
          disabled={!name.trim() || !!hello}
          className="w-full max-w-xs rounded-xl bg-blue-600 py-4 text-xl font-bold transition hover:bg-blue-500 disabled:opacity-40"
        >
          {hello ? 'Joining…' : 'Join'}
        </button>
      </div>
    );
  }

  if (state?.phase === 'playing' && state.gameId) {
    const Phone = GAME_UI[state.gameId]?.Phone;
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 px-8 text-white">
        {!connected && <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>}
        {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
        {Phone && gameView ? (
          <Phone
            view={gameView.view}
            players={state?.players ?? []}
            send={(action) => send({ type: 'action', action })}
          />
        ) : (
          <p className="text-xl">Loading…</p>
        )}
        {me.isHost && (
          <button
            onClick={() => send({ type: 'home' })}
            className="mt-12 w-full max-w-xs rounded-xl bg-white/10 py-4 text-xl font-bold transition hover:bg-white/20"
          >
            Back home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-900 px-8 text-white">
      {!connected && <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>}
      {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
      <p className="text-4xl font-bold">{me.name}</p>
      <p className="mt-2 text-white/50">You&apos;re home{me.isHost && ' · host'}</p>

      {me.isHost ? (
        <div className="mt-12 w-full max-w-xs space-y-4">
          {(state?.games ?? []).map((g) => (
            <div key={g.id}>
              <button
                onClick={() => send({ type: 'start', gameId: g.id })}
                className="w-full rounded-xl bg-blue-600 py-4 text-xl font-bold transition hover:bg-blue-500"
              >
                {g.name}
              </button>
              {GAME_UI[g.id]?.Tutorial && (
                <button
                  onClick={() => setTutorialGameId(g.id)}
                  className="mt-1 w-full text-sm text-white/40 underline underline-offset-2"
                >
                  How to play
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-white/40">Waiting for the host to choose a game…</p>
      )}

      {tutorialGameId &&
        GAME_UI[tutorialGameId]?.Tutorial &&
        (() => {
          const Tutorial = GAME_UI[tutorialGameId].Tutorial!;
          return <Tutorial onClose={() => setTutorialGameId(null)} />;
        })()}
    </div>
  );
}
