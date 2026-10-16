'use client';

import { use, useEffect, useState } from 'react';

import { normalizeRoomCode } from '@/lib/room-code';
import { usePartyRoom } from '@/lib/use-party-room';
import { AVATARS, isAvatar } from '@shared/avatars';
import type { HelloMessage, Player } from '@shared/party-types';
import { GAME_UI } from '@/games/ui';

interface Saved {
  name: string;
  token: string;
  avatar?: string;
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

const forget = (code: string) => {
  try {
    localStorage.removeItem(storageKey(code));
  } catch {
    // nothing to forget
  }
};

function AvatarPicker({
  value,
  taken = [],
  onPick,
}: {
  value: string;
  taken?: string[];
  onPick: (avatar: string) => void;
}) {
  return (
    <div className="grid w-full max-w-xs grid-cols-6 gap-2">
      {AVATARS.map((a) => {
        const isTaken = taken.includes(a) && a !== value;
        return (
          <button
            key={a}
            onClick={() => onPick(a)}
            disabled={isTaken}
            aria-label={`Play as ${a}`}
            className={`flex aspect-square items-center justify-center rounded-xl border text-2xl transition disabled:opacity-20 ${
              a === value
                ? 'border-[var(--home-magic)] bg-[var(--home-surface)] [box-shadow:0_0_12px_var(--home-magic-glow)]'
                : 'border-[var(--home-border)]'
            }`}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

// Host-only guest management at Home: hand over host, or remove someone
// (a ghost seat from a refreshed tab, or a person who left). Removing takes
// a second tap so a stray touch can't kick anyone.
function GuestList({
  players,
  me,
  send,
}: {
  players: Player[];
  me: Player;
  send: ReturnType<typeof usePartyRoom>['send'];
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const others = players.filter((p) => p.id !== me.id);
  if (others.length === 0) return null;

  return (
    <div className="mt-10 w-full max-w-xs">
      <p className="mb-2 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">
        Guests
      </p>
      <ul className="space-y-2">
        {others.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-2"
          >
            <span className={`text-2xl ${p.connected ? '' : 'opacity-40'}`}>
              {p.avatar}
            </span>
            <span className="flex-1 truncate">
              {p.name}
              {!p.connected && (
                <span className="block text-xs text-[var(--home-text-muted)]">
                  away
                </span>
              )}
            </span>
            <button
              onClick={() => send({ type: 'transferHost', playerId: p.id })}
              disabled={!p.connected}
              className="rounded-lg px-2 py-1.5 text-sm text-[var(--home-magic)] disabled:opacity-30"
            >
              Make host
            </button>
            <button
              onClick={() => {
                if (confirming !== p.id) return setConfirming(p.id);
                send({ type: 'kick', playerId: p.id });
                setConfirming(null);
              }}
              onBlur={() => setConfirming((c) => (c === p.id ? null : c))}
              className={`rounded-lg px-2 py-1.5 text-sm ${
                confirming === p.id
                  ? 'bg-[var(--home-ember)] font-bold text-[var(--home-bg)]'
                  : 'text-[var(--home-text-muted)]'
              }`}
            >
              {confirming === p.id ? 'Sure?' : 'Remove'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = normalizeRoomCode(use(params).code);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [hello, setHello] = useState<HelloMessage | null>(null);
  const [tutorialGameId, setTutorialGameId] = useState<string | null>(null);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const { state, you, gameView, lastError, connected, kicked, send } =
    usePartyRoom(code, hello);

  useEffect(() => {
    const saved = load(code);
    if (!saved) {
      // Random starting pick so a room full of people who don't bother
      // choosing doesn't all ask for the same character.
      setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
      return;
    }
    const savedAvatar = isAvatar(saved.avatar) ? saved.avatar : undefined;
    setName(saved.name);
    if (savedAvatar) setAvatar(savedAvatar);
    setHello({
      type: 'hello',
      role: 'player',
      name: saved.name,
      token: saved.token,
      avatar: savedAvatar,
    });
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
    save(code, { name: hello.name, token: you.token, avatar: hello.avatar });
    setHello({ ...hello, token: you.token });
  }, [code, you, hello]);

  const me = state?.players.find((p) => p.id === you?.playerId);

  // Keep the saved/resent avatar in step with whatever the server settled
  // on (it may have swapped a taken pick, or the player changed it), so a
  // reconnect doesn't ask for a stale one.
  useEffect(() => {
    if (
      !me ||
      hello?.role !== 'player' ||
      !hello.token ||
      hello.avatar === me.avatar
    )
      return;
    save(code, { name: hello.name, token: hello.token, avatar: me.avatar });
    setHello({ ...hello, avatar: me.avatar });
  }, [code, me, hello]);

  useEffect(() => {
    if (kicked) forget(code);
  }, [code, kicked]);

  const join = () => {
    if (!name.trim()) return;
    setHello({
      type: 'hello',
      role: 'player',
      name: name.trim(),
      token: load(code)?.token,
      avatar,
    });
  };

  // `hello` check: after "Knock again" clears it, the join form shows even
  // though `kicked` only resets once a new connection opens.
  if (kicked && hello) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[var(--home-bg)] px-8 text-center text-[var(--home-text)]">
        <p className="font-serif text-3xl font-bold">
          You&apos;ve been shown out
        </p>
        <p className="mt-3 text-[var(--home-text-muted)]">
          The host removed you from {code}.
        </p>
        <button
          onClick={() => setHello(null)}
          className="mt-10 w-full max-w-xs rounded-xl py-4 text-xl font-bold text-[var(--home-bg)] transition hover:brightness-110"
          style={{ background: 'var(--home-magic)' }}
        >
          Knock again
        </button>
      </div>
    );
  }

  if (!hello || !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--home-bg)] px-8 py-10 text-[var(--home-text)]">
        <p className="mb-2 text-sm tracking-widest text-[var(--home-text-muted)] uppercase">
          Come inside
        </p>
        <p className="mb-8 font-serif text-5xl font-bold tracking-widest text-[var(--home-magic)]">
          {code}
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="Your name"
          maxLength={20}
          autoFocus
          className="mb-5 w-full max-w-xs rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-4 text-center text-xl text-[var(--home-text)] placeholder-[var(--home-text-muted)] focus:border-[var(--home-magic)] focus:outline-none"
        />
        <p className="mb-2 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">
          Pick your character
        </p>
        <AvatarPicker value={avatar} onPick={setAvatar} />
        <button
          onClick={join}
          disabled={!name.trim() || !!hello}
          className="mt-6 w-full max-w-xs rounded-xl py-4 text-xl font-bold text-[var(--home-bg)] transition hover:brightness-110 disabled:opacity-40"
          style={{ background: 'var(--home-magic)' }}
        >
          {hello ? 'Joining…' : 'Join'}
        </button>
      </div>
    );
  }

  if (state?.phase === 'playing' && state.gameId) {
    const Phone = GAME_UI[state.gameId]?.Phone;
    const dealtIn = !state.gamePlayerIds || state.gamePlayerIds.includes(me.id);
    const gameName =
      state.games.find((g) => g.id === state.gameId)?.name ?? 'the game';
    return (
      <div className="flex h-screen flex-col items-center justify-center px-8 text-white">
        {!connected && (
          <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>
        )}
        {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
        {!dealtIn ? (
          // Joined mid-game: seated, but not part of this game's state.
          <div className="flex flex-col items-center text-center">
            {/* games bring their own full-bleed backdrop; this screen isn't a game */}
            <div className="fixed inset-0 -z-10 bg-gray-900" />
            <p className="text-5xl">{me.avatar}</p>
            <p className="mt-4 text-2xl font-bold">
              You&apos;re in, {me.name}!
            </p>
            <p className="mt-2 text-white/50">
              {gameName} is already underway — watch the TV. You&apos;ll be
              dealt into the next game.
            </p>
          </div>
        ) : Phone && gameView ? (
          <Phone
            view={gameView.view}
            players={state?.players ?? []}
            send={(action) => send({ type: 'action', action })}
          />
        ) : (
          <p className="text-xl">Loading…</p>
        )}
        {me.isHost && (
          <div className="mt-12 w-full max-w-xs space-y-3">
            <button
              onClick={() =>
                send({ type: 'joinOverlay', open: !state.joinOverlay })
              }
              className="w-full rounded-xl bg-white/10 py-3 text-lg font-medium transition hover:bg-white/20"
            >
              {state.joinOverlay ? 'Hide the join code' : 'Let someone in'}
            </button>
            <button
              onClick={() => send({ type: 'home' })}
              className="w-full rounded-xl bg-white/10 py-4 text-xl font-bold transition hover:bg-white/20"
            >
              Back home
            </button>
          </div>
        )}
      </div>
    );
  }

  const players = state?.players ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--home-bg)] px-8 py-10 text-[var(--home-text)]">
      {!connected && (
        <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>
      )}
      {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
      <button
        onClick={() => setPickingAvatar((v) => !v)}
        aria-label="Change character"
        className="animate-arrive text-6xl"
      >
        {me.avatar}
      </button>
      <p className="mt-2 font-serif text-4xl font-bold">{me.name}</p>
      <p className="mt-2 text-[var(--home-text-muted)]">
        You&apos;re home
        {me.isHost && <span className="text-[var(--home-magic)]"> · host</span>}
      </p>
      {pickingAvatar ? (
        <div className="mt-6 flex w-full flex-col items-center">
          <AvatarPicker
            value={me.avatar}
            taken={players.map((p) => p.avatar)}
            onPick={(a) => {
              if (a !== me.avatar) send({ type: 'avatar', avatar: a });
              setPickingAvatar(false);
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setPickingAvatar(true)}
          className="mt-1 text-sm text-[var(--home-text-muted)] underline underline-offset-2"
        >
          Change character
        </button>
      )}

      {me.isHost ? (
        <div className="mt-10 w-full max-w-xs space-y-4">
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
        <p className="mt-10 text-[var(--home-text-muted)]">
          Waiting for the host to choose a game…
        </p>
      )}

      {me.isHost && <GuestList players={players} me={me} send={send} />}

      {tutorialGameId &&
        GAME_UI[tutorialGameId]?.Tutorial &&
        (() => {
          const Tutorial = GAME_UI[tutorialGameId].Tutorial!;
          return <Tutorial onClose={() => setTutorialGameId(null)} />;
        })()}
    </div>
  );
}
