'use client';

import { use, useEffect, useState } from 'react';

import { normalizeRoomCode } from '@/lib/room-code';
import { usePartyRoom } from '@/lib/use-party-room';
import { AVATARS, AVATAR_NAMES, isAvatar } from '@shared/avatars';
import { GameList, GamePage, UpNext } from '@/app/components/home/game-picker';
import { HomeWallBackdrop } from '@/app/components/home/home-wall-backdrop';
import { PlayerToken } from '@/app/components/player-token';
import type { HelloMessage, Player } from '@shared/party-types';
import { GAME_UI } from '@/games/ui';

interface Saved {
  name: string;
  token: string;
  avatar?: string;
}

// The dev bench (`/dev`) opens several phones in one browser; `?as=<slot>`
// gives each its own saved seat, and `?name=` joins it without the form.
const storageKey = (code: string, slot: string | null) => `gohome:${code}${slot ? `:${slot}` : ''}`;

const load = (key: string): Saved | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};

const save = (key: string, value: Saved) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; reconnect just creates a new seat
  }
};

const forget = (key: string) => {
  try {
    localStorage.removeItem(key);
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
    <div className="grid w-full max-w-xs grid-cols-4 gap-2">
      {AVATARS.map((a) => {
        const isTaken = taken.includes(a) && a !== value;
        return (
          <button
            key={a}
            onClick={() => onPick(a)}
            disabled={isTaken}
            aria-label={`Play as ${AVATAR_NAMES[a]}`}
            className={`flex aspect-square items-center justify-center rounded-xl border p-2 transition disabled:opacity-20 ${
              a === value
                ? 'border-[var(--home-magic)] bg-[var(--home-surface)] [box-shadow:0_0_12px_var(--home-magic-glow)]'
                : 'border-[var(--home-border)]'
            }`}
          >
            <PlayerToken avatar={a} className="h-full w-full" />
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
            <span className={p.connected ? '' : 'opacity-40'}>
              <PlayerToken avatar={p.avatar} host={p.isHost} className="h-9 w-9" />
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
  const [key, setKey] = useState<string | null>(null);
  const { state, you, gameView, lastError, connected, kicked, send } =
    usePartyRoom(code, hello);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const key = storageKey(code, query.get('as'));
    setKey(key);
    const saved = load(key);
    if (!saved) {
      // Random starting pick so a room full of people who don't bother
      // choosing doesn't all ask for the same character.
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      setAvatar(randomAvatar);
      const devName = query.get('name')?.trim();
      if (devName) {
        setName(devName);
        setHello({ type: 'hello', role: 'player', name: devName, avatar: randomAvatar });
      }
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
    if (!key || !you || hello?.role !== 'player' || hello.token === you.token) return;
    save(key, { name: hello.name, token: you.token, avatar: hello.avatar });
    setHello({ ...hello, token: you.token });
  }, [key, you, hello]);

  const me = state?.players.find((p) => p.id === you?.playerId);

  // Keep the saved/resent avatar in step with whatever the server settled
  // on (it may have swapped a taken pick, or the player changed it), so a
  // reconnect doesn't ask for a stale one.
  useEffect(() => {
    if (
      !key ||
      !me ||
      hello?.role !== 'player' ||
      !hello.token ||
      hello.avatar === me.avatar
    )
      return;
    save(key, { name: hello.name, token: hello.token, avatar: me.avatar });
    setHello({ ...hello, avatar: me.avatar });
  }, [key, me, hello]);

  useEffect(() => {
    if (kicked && key) forget(key);
  }, [key, kicked]);

  const join = () => {
    if (!name.trim()) return;
    setHello({
      type: 'hello',
      role: 'player',
      name: name.trim(),
      token: key ? load(key)?.token : undefined,
      avatar,
    });
  };

  // `hello` check: after "Knock again" clears it, the join form shows even
  // though `kicked` only resets once a new connection opens.
  if (kicked && hello) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-8 text-center text-[var(--home-text)]">
        <HomeWallBackdrop />
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
      <div className="flex min-h-screen flex-col items-center justify-center px-8 py-10 text-[var(--home-text)]">
        <HomeWallBackdrop />
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
            <HomeWallBackdrop />
            <PlayerToken avatar={me.avatar} className="h-20 w-20" />
            <p className="mt-4 text-2xl font-bold text-[var(--home-text)]">
              You&apos;re in, {me.name}!
            </p>
            <p className="mt-2 text-[var(--home-text-muted)]">
              {gameName} is already underway — watch the TV. You&apos;ll be
              dealt into the next game.
            </p>
          </div>
        ) : Phone && gameView ? (
          <>
            <Phone
              view={gameView.view}
              players={state?.players ?? []}
              send={(action) => send({ type: 'action', action })}
            />
            {GAME_UI[state.gameId]?.Tutorial && (
              <button
                onClick={() => setTutorialGameId(state.gameId)}
                aria-label={`How to play ${gameName}`}
                className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-black/25 text-lg font-bold text-white/80 backdrop-blur-sm"
              >
                ?
              </button>
            )}
            {tutorialGameId === state.gameId &&
              (() => {
                const Tutorial = GAME_UI[state.gameId].Tutorial!;
                return <Tutorial onClose={() => setTutorialGameId(null)} />;
              })()}
          </>
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
  const picked = state?.games.find((g) => g.id === state.pickedGameId) ?? null;
  const tutorial =
    tutorialGameId &&
    GAME_UI[tutorialGameId]?.Tutorial &&
    (() => {
      const Tutorial = GAME_UI[tutorialGameId].Tutorial!;
      return <Tutorial onClose={() => setTutorialGameId(null)} />;
    })();

  if (me.isHost && picked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 py-10 text-[var(--home-text)]">
        <HomeWallBackdrop />
        {!connected && <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>}
        {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
        <GamePage
          game={picked}
          players={players}
          onBack={() => send({ type: 'pick', gameId: null })}
          onStart={() => send({ type: 'start', gameId: picked.id })}
          onRules={() => setTutorialGameId(picked.id)}
        />
        {tutorial}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 py-10 text-[var(--home-text)]">
      <HomeWallBackdrop />
      {!connected && (
        <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>
      )}
      {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
      <button
        onClick={() => setPickingAvatar((v) => !v)}
        aria-label="Change character"
        className="animate-arrive"
      >
        <PlayerToken avatar={me.avatar} host={me.isHost} className="h-24 w-24" />
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
        <div className="mt-10 w-full max-w-xs">
          <GameList games={state?.games ?? []} onPick={(gameId) => send({ type: 'pick', gameId })} />
        </div>
      ) : picked ? (
        <UpNext
          game={picked}
          hostName={players.find((p) => p.isHost)?.name ?? 'The host'}
          onRules={() => setTutorialGameId(picked.id)}
        />
      ) : (
        <p className="mt-10 text-[var(--home-text-muted)]">
          Waiting for the host to choose a game…
        </p>
      )}

      {me.isHost && <GuestList players={players} me={me} send={send} />}

      {tutorial}
    </div>
  );
}
