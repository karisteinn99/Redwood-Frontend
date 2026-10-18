'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { ROOM_DOORS, type RoomDoor } from '@/games/rooms';
import type { Player } from '@shared/party-types';

import { GuestRail } from './guest-rail';
import { HomeField, type WaveSource } from './home-field';
import { HomeLogo } from './home-logo';
import { PANES, windowMarkup, type Pane } from './home-windows';
import { StyledQr } from './styled-qr';

const STAGE_W = 1920, STAGE_H = 1080;

// Home's own identity — the wood-panelled cabin from the Home TV design
// review (see the design system: HomeWall, JoinCode, RoomWindow, GuestRail).
// Laid out on a fixed 1920×1080 stage scaled to the screen, because the
// target is a 65" TV at 1080p and every size was reviewed in those pixels.
//
// The TV never takes input (the host picks games on their phone); the
// fullscreen button is the one exception, a one-time setup action.
// The portal transition into a game is driven by server state (see
// room/[code]/page.tsx), not by anything here.
function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
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
      className="fixed top-3 right-3 z-20 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)]/80 px-3 py-1.5 text-xs text-[var(--home-text-muted)] opacity-60 transition hover:text-[var(--home-text)] hover:opacity-100"
    >
      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
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
}: {
  code: string;
  joinUrl: string;
  players: Player[];
  doorRefs: Partial<Record<string, RefObject<HTMLDivElement | null>>>;
}) {
  const scale = useStageScale();
  const stage = useRef<HTMLDivElement>(null);
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
          <div className="absolute top-0 left-0">
            <HomeLogo />
          </div>

          <div className="absolute top-[236px] left-0 flex items-center gap-16">
            <div className="h-[360px] w-[360px] shrink-0 overflow-hidden rounded-[26px] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
              <StyledQr value={joinUrl} className="block h-full w-full" />
            </div>
            <div className="flex flex-col gap-3.5">
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

          <div className="absolute bottom-0 -left-[76px] flex items-end gap-10">
            {ROOM_DOORS.map((d, i) => (
              <RoomWindow
                key={d.gameId}
                door={d}
                pane={PANES[d.pane]}
                ref={doorRefs[d.gameId]}
                lit={breathing.has(i)}
              />
            ))}
            <RoomWindow pane={PANES.building} label="In construction" />
          </div>
        </div>

        <aside className="absolute top-[54px] right-[96px] bottom-[54px] z-[1] w-[520px]">
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
}: {
  door?: RoomDoor;
  pane: Pane;
  label?: string;
  lit?: boolean;
  ref?: RefObject<HTMLDivElement | null>;
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
    >
      <div ref={ref} className="relative h-[260px] w-[176px]">
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
        }}
      >
        {door?.label ?? label}
      </span>
    </div>
  );
}
