'use client';

import { use, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { normalizeRoomCode } from '@/lib/room-code';
import { usePartyRoom } from '@/lib/use-party-room';
import { AVATARS, AVATAR_NAMES, isAvatar } from '@shared/avatars';
import { GameList, GameStage, UpNextToast } from '@/app/components/home/game-picker';
import { HomeWallBackdrop } from '@/app/components/home/home-wall-backdrop';
import { LoadingScreen } from '@/app/components/home/loading-screen';
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
                ? 'border-[var(--home-gold)] bg-[var(--home-surface)] [box-shadow:0_0_12px_var(--home-gold-glow)]'
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
// (a ghost seat from a refreshed tab, or a person who left), from a ⋯ menu
// on each row. Removing takes a second tap so a stray touch can't kick anyone.
function GuestList({
  players,
  me,
  send,
}: {
  players: Player[];
  me: Player;
  send: ReturnType<typeof usePartyRoom>['send'];
}) {
  const [menu, setMenu] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const others = players.filter((p) => p.id !== me.id);
  if (others.length === 0) return null;

  const close = () => {
    setMenu(null);
    setConfirming(false);
  };

  return (
    <div className="mt-10 w-full max-w-xs">
      <p className="mb-2 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">
        Guests
      </p>
      <ul className="space-y-2">
        {others.map((p) => (
          <li
            key={p.id}
            className="relative flex items-center gap-3 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] py-2 pr-1 pl-3"
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
              onClick={() => {
                setConfirming(false);
                setMenu((m) => (m === p.id ? null : p.id));
              }}
              aria-label={`Options for ${p.name}`}
              aria-expanded={menu === p.id}
              className="rounded-lg px-3 py-3 text-[var(--home-text-muted)] transition hover:text-[var(--home-text)]"
            >
              <svg width="20" height="4" viewBox="0 0 20 4" fill="currentColor" aria-hidden="true">
                <circle cx="2" cy="2" r="2" />
                <circle cx="10" cy="2" r="2" />
                <circle cx="18" cy="2" r="2" />
              </svg>
            </button>
            {menu === p.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={close} />
                <div className="absolute top-full right-1 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => {
                      send({ type: 'transferHost', playerId: p.id });
                      close();
                    }}
                    disabled={!p.connected}
                    className="block w-full px-4 py-3 text-left transition hover:bg-white/5 disabled:opacity-40"
                  >
                    Make host
                  </button>
                  <button
                    onClick={() => {
                      if (!confirming) return setConfirming(true);
                      send({ type: 'kick', playerId: p.id });
                      close();
                    }}
                    className={`block w-full border-t border-[var(--home-border)] px-4 py-3 text-left transition ${
                      confirming
                        ? 'bg-[var(--home-ember)] font-bold text-[var(--home-bg)]'
                        : 'text-[var(--home-ember)] hover:bg-white/5'
                    }`}
                  >
                    {confirming ? 'Tap again to remove' : 'Remove'}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// You, in the top-right corner of every Home screen: your character and
// name, tap to change character. Right after joining it first fades in large
// in the middle of the screen, then slides up into the corner.
const INTRO_HOLD_MS = 1100;
const INTRO_MOVE_MS = 600;

function MeChip({
  me,
  players,
  code,
  intro,
  onIntroDone,
  onLeave,
  send,
}: {
  me: Player;
  code: string;
  players: Player[];
  intro: boolean;
  onIntroDone: () => void;
  onLeave: () => void;
  send: ReturnType<typeof usePartyRoom>['send'];
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [stage, setStage] = useState<'hidden' | 'center' | 'corner'>(intro ? 'hidden' : 'corner');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [picking, setPicking] = useState(false);

  useLayoutEffect(() => {
    if (!intro) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('corner');
      onIntroDone();
      return;
    }
    const r = ref.current!.getBoundingClientRect();
    setOffset({
      x: window.innerWidth / 2 - (r.left + r.width / 2),
      y: window.innerHeight / 2 - (r.top + r.height / 2),
    });
    const show = requestAnimationFrame(() => requestAnimationFrame(() => setStage('center')));
    const move = setTimeout(() => setStage('corner'), INTRO_HOLD_MS);
    const done = setTimeout(onIntroDone, INTRO_HOLD_MS + INTRO_MOVE_MS - 150);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(move);
      clearTimeout(done);
    };
    // runs once, on the screen's first paint
  }, []);

  const away = stage !== 'corner';
  return (
    <>
      <button
        ref={ref}
        onClick={() => {
          setConfirmLeave(false);
          setPicking((v) => !v);
        }}
        aria-label="Change character or leave"
        aria-expanded={picking}
        className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 flex items-center gap-2 rounded-full border border-[var(--home-border)] bg-[color-mix(in_srgb,var(--home-surface)_85%,transparent)] py-1 pr-1 pl-3.5 text-[var(--home-text)]"
        style={{
          transform: away ? `translate(${offset.x}px, ${offset.y}px) scale(2.2)` : undefined,
          opacity: stage === 'hidden' ? 0 : 1,
          transition:
            stage === 'center'
              ? 'opacity 450ms ease'
              : `transform ${INTRO_MOVE_MS}ms cubic-bezier(0.3, 0.7, 0.2, 1), opacity 450ms ease`,
          borderColor: away ? 'transparent' : undefined,
          backgroundColor: away ? 'transparent' : undefined,
        }}
      >
        <span className="max-w-[9rem] truncate font-[family-name:var(--font-display)] text-base font-bold">
          {me.name}
        </span>
        <PlayerToken avatar={me.avatar} host={me.isHost} className="h-9 w-9" />
      </button>
      {picking && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPicking(false)} />
          <div className="fixed top-[calc(max(1rem,env(safe-area-inset-top))+3.5rem)] right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
            <p className="mb-3 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">
              Pick your character
            </p>
            <AvatarPicker
              value={me.avatar}
              taken={players.map((p) => p.avatar)}
              onPick={(a) => {
                if (a !== me.avatar) send({ type: 'avatar', avatar: a });
                setPicking(false);
              }}
            />
            <button
              onClick={() => (confirmLeave ? onLeave() : setConfirmLeave(true))}
              className={`mt-4 w-full rounded-xl border py-3 font-bold transition ${
                confirmLeave
                  ? 'border-[var(--home-ember)] bg-[var(--home-ember)] text-[var(--home-bg)]'
                  : 'border-[var(--home-border)] text-[var(--home-ember)] hover:border-[var(--home-ember)]'
              }`}
            >
              {confirmLeave ? 'Tap again to leave' : `Leave ${code}`}
            </button>
          </div>
        </>
      )}
    </>
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
  // True from a fresh join until your character has settled into the corner.
  const [intro, setIntro] = useState(false);
  // Set when this phone left the room on its own, from the character menu.
  const [left, setLeft] = useState(false);
  // The game this phone has open at Home (everyone browses on their own).
  const [viewing, setViewing] = useState<string | null>(null);
  // null until this phone's saved seat (if any) has been looked up.
  const [key, setKey] = useState<string | null>(null);
  const { state, you, gameView, lastError, reconnecting, kicked, send } =
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
        setIntro(true);
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

  const leave = () => {
    send({ type: 'leave' });
    if (key) forget(key);
    setLeft(true);
    setIntro(false);
    // after the leave goes out; clearing hello closes the connection
    setTimeout(() => setHello(null), 150);
  };

  const join = () => {
    if (!name.trim()) return;
    setIntro(true);
    setHello({
      type: 'hello',
      role: 'player',
      name: name.trim(),
      token: key ? load(key)?.token : undefined,
      avatar,
    });
  };

  if (left) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-8 text-center text-[var(--home-text)]">
        <HomeWallBackdrop />
        <p className="font-[family-name:var(--font-display)] text-3xl font-bold">You&apos;ve left {code}</p>
        <p className="mt-3 text-[var(--home-text-muted)]">See you next time.</p>
        <button
          onClick={() => {
            setLeft(false);
            setName('');
          }}
          className="home-gold-fill mt-10 w-full max-w-xs rounded-xl py-4 text-xl font-bold transition hover:brightness-110"
        >
          Join again
        </button>
        <a href="/" className="mt-4 py-2 text-[var(--home-text-muted)] underline underline-offset-4">
          Back to the start
        </a>
      </div>
    );
  }

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
          className="home-gold-fill mt-10 w-full max-w-xs rounded-xl py-4 text-xl font-bold transition hover:brightness-110"
          
        >
          Knock again
        </button>
      </div>
    );
  }

  // Before the saved seat is checked, or while rejoining it, show the quiet
  // loader rather than flashing the join form or a half-built screen.
  if (key === null || (hello?.role === 'player' && !me && !kicked && !lastError)) return <LoadingScreen />;

  if (!hello || !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 py-10 text-[var(--home-text)]">
        <HomeWallBackdrop />
        <p className="mb-2 text-sm tracking-widest text-[var(--home-text-muted)] uppercase">
          Come inside
        </p>
        <p className="mb-8 font-serif text-5xl font-bold tracking-widest text-[var(--home-gold)]">
          {code}
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="Your name"
          maxLength={20}
          // not inside the dev bench's frames, where focusing would scroll the bench
          autoFocus={typeof window !== 'undefined' && window.self === window.top}
          className="mb-5 w-full max-w-xs rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-4 text-center text-xl text-[var(--home-text)] placeholder-[var(--home-text-muted)] focus:border-[var(--home-gold)] focus:outline-none"
        />
        <p className="mb-2 text-xs tracking-widest text-[var(--home-text-muted)] uppercase">
          Pick your character
        </p>
        <AvatarPicker value={avatar} onPick={setAvatar} />
        <button
          onClick={join}
          disabled={!name.trim() || !!hello}
          className="home-gold-fill mt-6 w-full max-w-xs rounded-xl py-4 text-xl font-bold transition hover:brightness-110"
          
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
    if (dealtIn && !gameView) return <LoadingScreen />;
    return (
      <div className="flex h-screen flex-col items-center justify-center px-8 text-white">
        {reconnecting && (
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
  const games = state?.games ?? [];
  const picked = games.find((g) => g.id === state?.pickedGameId) ?? null;
  // The host always sits on the game that's up next; guests choose freely.
  const openId = me.isHost && picked ? picked.id : viewing;
  const open = games.find((g) => g.id === openId) ?? null;
  const hostName = players.find((p) => p.isHost)?.name ?? 'The host';
  const tutorial =
    tutorialGameId &&
    GAME_UI[tutorialGameId]?.Tutorial &&
    (() => {
      const Tutorial = GAME_UI[tutorialGameId].Tutorial!;
      return <Tutorial theme="home" onClose={() => setTutorialGameId(null)} />;
    })();
  const back = () => {
    // Going back from the host's up-next page takes the game off the TV.
    if (me.isHost && picked) send({ type: 'pick', gameId: null });
    setViewing(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 pt-20 pb-10 text-[var(--home-text)]">
      <HomeWallBackdrop />
      {open && !intro && (
        <button
          onClick={back}
          className="animate-home-fade fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-20 flex h-11 items-center px-2 text-[var(--home-text-muted)] hover:text-[var(--home-text)]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mr-1 h-5 w-5">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Games
        </button>
      )}
      <MeChip
        me={me}
        players={players}
        code={code}
        intro={intro}
        onIntroDone={() => setIntro(false)}
        onLeave={leave}
        send={send}
      />
      {!me.isHost && picked && open?.id !== picked.id && !intro && (
        <UpNextToast key={picked.id} game={picked} onOpen={() => setViewing(picked.id)} />
      )}

      <div className={`flex w-full flex-col items-center ${intro ? 'invisible' : 'animate-home-fade'}`}>
        {reconnecting && <p className="mb-4 text-sm text-yellow-400">Reconnecting…</p>}
        {lastError && <p className="mb-4 text-sm text-red-400">{lastError}</p>}
        {open ? (
          <GameStage
            key={open.id}
            game={open}
            players={players}
            mode={
              me.isHost
                ? picked
                  ? 'host-upnext'
                  : 'host-browse'
                : picked?.id === open.id
                  ? 'guest-upnext'
                  : 'guest-browse'
            }
            hostName={hostName}
            onPlay={() => send({ type: 'pick', gameId: open.id })}
            onStart={() => send({ type: 'start', gameId: open.id })}
            onRules={() => setTutorialGameId(open.id)}
          />
        ) : me.isHost ? (
          <>
            <GameList games={games} title="Pick a game" onOpen={setViewing} />
            <GuestList players={players} me={me} send={send} />
          </>
        ) : (
          <>
            <p className="mb-8 text-center text-[var(--home-text-muted)]">
              {hostName} picks the game. Have a look around.
            </p>
            <GameList games={games} title="Games" upNextId={picked?.id} onOpen={setViewing} />
          </>
        )}
      </div>

      {tutorial}
    </div>
  );
}
