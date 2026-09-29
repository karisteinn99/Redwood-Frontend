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

  // Once the server confirms a token, fold it back into `hello` itself (not
  // just localStorage) — usePartyRoom resends this exact object on every
  // reconnect, including partysocket's own automatic ones. Without this, a
  // dropped-and-restored connection (a phone locking its screen, backgrounding
  // the browser, switching wifi/cellular — all far more common on mobile than
  // in a steady desktop tab) would silently rejoin as a brand-new seat with a
  // later joinedAt, handing host to whoever never disconnected.
  useEffect(() => {
    if (!you || hello?.role !== 'player' || hello.token === you.token) return;
    save(code, { name: hello.name, token: you.token });
    setHello({ ...hello, token: you.token });
  }, [code, you, hello]);

  const join = () => {
    if (!name.trim()) return;
    setHello({ type: 'hello', role: 'player', name: name.trim(), token: load(code)?.token });
  };

  const me = state?.players.find((p) => p.id === you?.playerId);

  if (!hello || !me) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[var(--home-bg)] px-8 text-[var(--home-text)]">
        <p className="mb-2 text-sm tracking-widest text-[var(--home-text-muted)] uppercase">Come inside</p>
        <p className="mb-10 font-serif text-5xl font-bold tracking-widest text-[var(--home-magic)]">{code}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="Your name"
          maxLength={20}
          autoFocus
          className="mb-4 w-full max-w-xs rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-4 text-center text-xl text-[var(--home-text)] placeholder-[var(--home-text-muted)] focus:border-[var(--home-magic)] focus:outline-none"
        />
        <button
          onClick={join}
          disabled={!name.trim() || !!hello}
          className="w-full max-w-xs rounded-xl py-4 text-xl font-bold text-[var(--home-bg)] transition hover:brightness-110 disabled:opacity-40"
          style={{ background: 'var(--home-magic)' }}
        >
          {hello ? 'Joining…' : 'Join'}
        </button>
      </div>
    );
  }

  if (state?.phase === 'playing' && state.gameId) {
    const Phone = GAME_UI[state.gameId]?.Phone;
    return (
      <div className="flex h-screen flex-col items-center justify-center px-8 text-white">
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
    <div className="flex h-screen flex-col items-center justify-center bg-[var(--home-bg)] px-8 text-[var(--home-text)]">
      {!connected && <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>}
      {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
      <p className="font-serif text-4xl font-bold">{me.name}</p>
      <p className="mt-2 text-[var(--home-text-muted)]">
        You&apos;re home{me.isHost && <span className="text-[var(--home-magic)]"> · host</span>}
      </p>

      {me.isHost ? (
        <div className="mt-12 w-full max-w-xs space-y-4">
          {(state?.games ?? []).map((g) => (
            <div key={g.id}>
              <button
                onClick={() => send({ type: 'start', gameId: g.id })}
                className="w-full rounded-xl py-4 text-xl font-bold text-[var(--home-bg)] transition hover:brightness-110"
                style={{ background: 'var(--home-magic)' }}
              >
                {g.name}
              </button>
              {GAME_UI[g.id]?.Tutorial && (
                <button
                  onClick={() => setTutorialGameId(g.id)}
                  className="mt-1 w-full text-sm text-[var(--home-text-muted)] underline underline-offset-2"
                >
                  How to play
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-[var(--home-text-muted)]">Waiting for the host to choose a game…</p>
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
