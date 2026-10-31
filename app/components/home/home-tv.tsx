'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { ROOM_DOORS, type RoomDoor } from '@/games/rooms';
import { GAME_UI } from '@/games/ui';
import type { GameInfo } from '@shared/game';
import type { Player } from '@shared/party-types';

import { GuestRail } from './guest-rail';
import { HomeField, type WaveSource } from './home-field';
import { HomeLogo } from './home-logo';
import { PANES, windowMarkup, type Pane } from './home-windows';
import { StyledQr } from './styled-qr';

const STAGE_W = 1920, STAGE_H = 1080;

// Up next: when the host picks a game, the lobby rearranges itself instead
// of cutting to a new screen. The picked window grows to the left, the QR
// shrinks into the bottom-right corner, the other windows and the big code
// fade away, and the game's three-line rules fade in. Only transform and
// opacity move, so the TV's GPU keeps it smooth. Positions are in the left
// column's own pixels (it starts at 96,54 on the stage).
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const MOVE_MS = 950;
const QR_TO = { x: 1144, y: 846, scale: 120 / 360 };
const WINDOW_TO = { x: 14, y: 176, scale: 1.875 };
const windowFrom = (i: number) => ({ x: -14 + i * 340, y: 646 });

// "2–8 players", or what's keeping the game from starting.
function playersLine(game: GameInfo, count: number) {
  if (count < game.minPlayers) {
    const n = game.minPlayers - count;
    return `Needs ${n} more player${n === 1 ? '' : 's'}`;
  }
  if (count > game.maxPlayers) return `${count} players at home. The maximum is ${game.maxPlayers}.`;
  return game.minPlayers === game.maxPlayers ? `${game.minPlayers} players` : `${game.minPlayers}–${game.maxPlayers} players`;
}

// A transition that waits for the moves when appearing, and goes first when
// disappearing, so nothing overlaps mid-flight.
const fade = (shown: boolean, inDelay = 520, ms = 480) => ({
  opacity: shown ? 1 : 0,
  transform: shown ? 'none' : 'translateY(14px)',
  transition: `opacity ${ms}ms ${EASE} ${shown ? inDelay : 0}ms, transform ${ms}ms ${EASE} ${shown ? inDelay : 0}ms`,
});

// Home's own identity — the wood-panelled cabin from the Home TV design
// review (see the design system: HomeWall, JoinCode, RoomWindow, GuestRail).
// Laid out on a fixed 1920×1080 stage scaled to the screen, because the
// target is a 65" TV at 1080p and every size was reviewed in those pixels.
//
// The TV never takes input (the host picks games on their phone); the
// fullscreen icon is the one exception, a one-time setup action that only
// shows while the mouse moves.
// The portal transition into a game is driven by server state (see
// room/[code]/page.tsx), not by anything here.
function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Hidden until the mouse moves, then a faint icon that fades again after
  // a moment of stillness, so the TV doesn't look like a website.
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    let t: ReturnType<typeof setTimeout> | undefined;
    const onMove = () => {
      setAwake(true);
      clearTimeout(t);
      t = setTimeout(() => setAwake(false), 2500);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('mousemove', onMove);
      clearTimeout(t);
    };
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      className={`fixed top-4 right-4 z-20 p-2 text-[var(--home-text)] transition-opacity duration-500 hover:opacity-80 focus-visible:opacity-80 ${awake ? 'opacity-25' : 'opacity-0'}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isFullscreen ? (
          <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
        ) : (
          <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
        )}
      </svg>
    </button>
  );
}

// Scale that fits the 1920×1080 stage inside the viewport.
function useStageScale() {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

export function HomeTv({
  code,
  joinUrl,
  players,
  doorRefs,
  picked = null,
}: {
  code: string;
  joinUrl: string;
  players: Player[];
  doorRefs: Partial<Record<string, RefObject<HTMLDivElement | null>>>;
  picked?: GameInfo | null;
}) {
  const scale = useStageScale();
  const stage = useRef<HTMLDivElement>(null);
  // The Up next copy stays mounted a moment after the host goes back, so it
  // can fade out instead of vanishing.
  const [copyGame, setCopyGame] = useState<GameInfo | null>(picked);
  useEffect(() => {
    if (picked) return setCopyGame(picked);
    const t = setTimeout(() => setCopyGame(null), 500);
    return () => clearTimeout(t);
  }, [picked]);
  const [breathing, setBreathing] = useState<Set<number>>(new Set());

  // Wave origins in stage pixels: each live window's centre, a little high.
  const sources = useCallback((): WaveSource[] => {
    const s = stage.current?.getBoundingClientRect();
    if (!s) return [];
    const k = s.width / STAGE_W;
    return ROOM_DOORS.flatMap((d) => {
      const r = doorRefs[d.gameId]?.current?.getBoundingClientRect();
      return r ? [{ x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height * 0.45) / k, rgb: d.wave }] : [];
    });
  }, [doorRefs]);

  const breathe = useCallback((i: number) => {
    setBreathing((b) => new Set(b).add(i));
    setTimeout(
      () =>
        setBreathing((b) => {
          const next = new Set(b);
          next.delete(i);
          return next;
        }),
      1000,
    );
  }, []);

  const word = code.replace(/\d+$/, '');
  const num = code.slice(word.length);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#15110d] select-none">
      <FullscreenButton />
      <div
        ref={stage}
        className="absolute top-1/2 left-1/2 h-[1080px] w-[1920px] overflow-hidden bg-[#241e17] font-[family-name:var(--font-read)] text-[var(--home-text)]"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="home-wall absolute inset-0" />
        <svg className="absolute inset-0 h-[1080px] w-[1920px] opacity-80 mix-blend-overlay" aria-hidden="true">
          <filter id="home-woodgrain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.11" numOctaves={4} seed={7} />
            <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.38  0 0 0 0 0.22  0 0 0 1.4 -0.45" />
          </filter>
          <rect width="1920" height="1080" filter="url(#home-woodgrain)" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_760px_520px_at_260px_120px,rgba(240,151,60,0.14),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[26px] border-t-2 border-[rgba(255,220,170,0.08)] bg-[linear-gradient(#1a140f,#120e0a)]" />
        <HomeField sources={sources} onBreath={breathe} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_45%,transparent_55%,rgba(0,0,0,0.5))]" />

        <div className="absolute top-[54px] bottom-[54px] left-[96px] z-[1] w-[1144px]">
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: picked ? 'scale(0.7)' : 'none', transition: `transform ${MOVE_MS}ms ${EASE}` }}
          >
            <HomeLogo />
          </div>

          <div className="absolute top-[236px] left-0 flex items-center gap-16">
            <div
              className="h-[360px] w-[360px] shrink-0 origin-top-left overflow-hidden rounded-[26px] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
              style={{
                transform: picked ? `translate(${QR_TO.x}px, ${QR_TO.y - 236}px) scale(${QR_TO.scale})` : 'none',
                transition: `transform ${MOVE_MS}ms ${EASE} ${picked ? 0 : 450}ms`,
              }}
            >
              <StyledQr value={joinUrl} className="block h-full w-full" />
            </div>
            <div className="flex flex-col gap-3.5" style={fade(!picked, 1100, 420)}>
              <span className="home-code text-[136px] leading-[0.9] font-bold tracking-[0.01em] whitespace-nowrap">
                {word}
                <span className="home-code-num ml-[0.06em]">{num}</span>
              </span>
              <span className="mt-[18px] flex flex-col gap-1">
                <span className="text-[30px] text-[var(--home-text-muted)]">Scan the code, or go to</span>
                <b className="text-[40px] font-bold tracking-[0.01em] whitespace-nowrap">
                  gohomegames.com/join/
                  <span className="text-[var(--home-code-mid)]">
                    {word}
                    <span className="text-[var(--home-code-top)]">{num}</span>
                  </span>
                </b>
              </span>
            </div>
          </div>

          {/* the shrunken QR's caption, in the bottom-right corner */}
          <div
            className="absolute flex flex-col gap-1 whitespace-nowrap"
            style={{ left: QR_TO.x + 120 + 24, top: QR_TO.y + 22, ...fade(!!picked, 950) }}
          >
            <span className="text-[22px] text-[var(--home-text-muted)]">Still coming? Join at</span>
            <b className="text-[26px] font-bold">
              gohomegames.com/join/
              <span className="text-[var(--home-code-mid)]">
                {word}
                <span className="text-[var(--home-code-top)]">{num}</span>
              </span>
            </b>
          </div>

          <div className="absolute bottom-0 -left-[76px] flex items-end gap-10">
            {ROOM_DOORS.map((d, i) => {
              const isPicked = picked?.id === d.gameId;
              const from = windowFrom(i);
              return (
                <RoomWindow
                  key={d.gameId}
                  door={d}
                  pane={PANES[d.pane]}
                  ref={doorRefs[d.gameId]}
                  lit={breathing.has(i)}
                  mode={!picked ? 'lobby' : isPicked ? 'big' : 'gone'}
                  bigMove={`translate(${WINDOW_TO.x - from.x}px, ${WINDOW_TO.y - from.y}px) scale(${WINDOW_TO.scale})`}
                />
              );
            })}
            <RoomWindow pane={PANES.building} label="In construction" mode={picked ? 'gone' : 'lobby'} />
          </div>

          {copyGame && (
            <UpNextCopy
              key={copyGame.id}
              game={copyGame}
              visible={!!picked}
              count={players.filter((p) => p.connected).length}
            />
          )}
        </div>

        <aside className={`absolute top-[54px] right-[96px] z-[1] w-[520px] ${picked ? 'bottom-[230px]' : 'bottom-[54px]'}`}>
          <GuestRail players={players} />
        </aside>
      </div>
    </div>
  );
}

function RoomWindow({
  door,
  pane,
  label,
  lit = false,
  ref,
  mode = 'lobby',
  bigMove,
}: {
  door?: RoomDoor;
  pane: Pane;
  label?: string;
  lit?: boolean;
  ref?: RefObject<HTMLDivElement | null>;
  // 'big' grows this window into the Up next spot (via bigMove); 'gone' fades it away.
  mode?: 'lobby' | 'big' | 'gone';
  bigMove?: string;
}) {
  const id = `win${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const live = !!door;
  const title = door?.title;
  // Memoised so re-renders (the window lighting up and dimming) never replace
  // the SVG's contents: fresh nodes can't transition, so the breath would snap
  // on and off instead of swelling and fading.
  const markup = useMemo(() => ({ __html: windowMarkup(pane, id) }), [pane, id]);
  return (
    <div
      className={`flex w-[300px] shrink-0 flex-col items-center gap-[22px] ${lit ? 'home-window-lit' : ''}`}
      style={mode === 'gone' ? { ...fade(false), pointerEvents: 'none' } : fade(true, 900)}
    >
      <div
        ref={ref}
        className="relative h-[260px] w-[176px] origin-top-left"
        style={{
          transform: mode === 'big' ? bigMove : 'none',
          transition: `transform ${MOVE_MS}ms ${EASE} ${mode === 'big' ? 380 : 150}ms`,
        }}
      >
        <svg
          viewBox="0 0 176 260"
          className={`absolute inset-0 overflow-visible ${live ? '' : 'opacity-60 grayscale brightness-90'}`}
          aria-hidden="true"
          dangerouslySetInnerHTML={markup}
        />
      </div>
      <span
        className={`flex h-11 items-center bg-clip-text text-[34px] font-bold tracking-[0.02em] whitespace-nowrap text-transparent ${live ? '' : 'opacity-70'}`}
        style={{
          backgroundImage: title
            ? `linear-gradient(180deg, ${title[0]} 0%, ${title[1]} 50%, ${title[2]} 100%)`
            : 'linear-gradient(180deg, #d9d0bf 0%, #a99d84 100%)',
          ...fade(mode !== 'big', 1000, 300),
        }}
      >
        {door?.label ?? label}
      </span>
    </div>
  );
}

// The Up next copy beside the grown window: the title and the game in three
// short lines (the full rules are on the phones), and under the window how
// many players it takes.
function UpNextCopy({ game, count, visible }: { game: GameInfo; count: number; visible: boolean }) {
  const door = ROOM_DOORS.find((d) => d.gameId === game.id);
  const rules = GAME_UI[game.id]?.tvRules ?? [];
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(raf);
  }, []);
  const shown = mounted && visible;
  const title = door?.title;
  return (
    <>
      <p
        className="absolute w-[330px] text-center text-[30px] text-[var(--home-text-muted)]"
        style={{ left: WINDOW_TO.x, top: WINDOW_TO.y + 274 * WINDOW_TO.scale + 26, ...fade(shown, 1250) }}
      >
        {playersLine(game, count)}
      </p>
      <div className="absolute top-[146px] left-[444px] w-[700px]">
        <p
          className="mb-3 text-[26px] tracking-[0.3em] text-[var(--home-text-muted)] uppercase"
          style={fade(shown, 1000)}
        >
          Up next
        </p>
        <p
          className="bg-clip-text font-[family-name:var(--font-display)] text-[112px] leading-none font-bold whitespace-nowrap text-transparent"
          style={{
            backgroundImage: title ? `linear-gradient(180deg, ${title[0]}, ${title[1]} 50%, ${title[2]})` : undefined,
            color: title ? undefined : 'var(--home-text)',
            ...fade(shown, 1060),
          }}
        >
          {game.name}
        </p>
        <ol className="mt-12 space-y-9">
          {rules.map(([head, line], i) => (
            <li key={head} className="flex gap-6" style={fade(shown, 1160 + i * 110)}>
              <span className="w-9 font-[family-name:var(--font-display)] text-[56px] leading-none font-bold text-[var(--home-brass)] italic">
                {i + 1}
              </span>
              <span>
                <b className="block text-[40px] leading-tight">{head}</b>
                <span className="block text-[30px] leading-snug text-[var(--home-text-muted)]">{line}</span>
              </span>
            </li>
          ))}
        </ol>
        {rules.length > 0 && (
          <p className="mt-10 text-[26px] text-[var(--home-text-muted)]" style={fade(shown, 1500)}>
            The full rules are on everyone&apos;s phone.
          </p>
        )}
      </div>
    </>
  );
}
