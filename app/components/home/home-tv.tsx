import { QRCodeSVG } from 'qrcode.react';
import type { RefObject } from 'react';

import type { Player } from '@shared/party-types';

// Home's own identity — a cozy cabin, distinct from any room's theme (see
// AGENTS.md: rooms have their own permanent aesthetic, not the app itself).
// The doors are decorative on the TV — the TV never takes input. The Ship
// door's glow just signals "this room is active"; the actual portal
// transition is driven by server state (see room/[code]/page.tsx), not a
// click here.
export function HomeTv({
  code,
  joinUrl,
  players,
  shipDoorRef,
}: {
  code: string;
  joinUrl: string;
  players: Player[];
  shipDoorRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-[clamp(0.5rem,2vh,1.25rem)] bg-[var(--home-bg)] p-[clamp(0.75rem,2vw,2rem)] text-[var(--home-text)]">
      {/* subtle wood-grain texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(100deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 34px)',
        }}
      />

      <div className="relative flex w-full flex-1 flex-col items-center justify-evenly gap-[clamp(0.5rem,2vh,1rem)] [@media(max-height:700px)]:flex-row [@media(max-height:700px)]:items-center [@media(max-height:700px)]:justify-center [@media(max-height:700px)]:gap-[clamp(1rem,4vw,3rem)]">
        {/* left: candles + garden window + welcome + join card */}
        <div className="flex flex-col items-center gap-[clamp(0.5rem,2vh,1rem)]">
          <div className="flex items-end gap-[clamp(0.75rem,2vw,1.25rem)]">
            <Candle />
            <CabinWindow />
            <Candle />
          </div>

          <div className="text-center">
            <h1 className="font-serif text-[clamp(1.1rem,2.4vw,1.6rem)] font-bold tracking-wide">
              Welcome Home
            </h1>
            <p className="mt-1 text-[clamp(0.7rem,1.3vw,0.85rem)] text-[var(--home-text-muted)]">
              Everyone&apos;s waiting for you
            </p>
          </div>

          <JoinCard code={code} joinUrl={joinUrl} />
        </div>

        {/* right: doors */}
        <div className="flex items-end gap-[clamp(1rem,3vw,2.25rem)]">
          <Door label="The Lounge" labelClass="text-[var(--home-ember)]" />
          <Door ref={shipDoorRef} label="Liar's Game" magic />
          <Door label="" locked />
        </div>
      </div>

      <div className="relative flex flex-wrap justify-center gap-[clamp(0.4rem,1vw,0.6rem)]">
        {players.length === 0 && (
          <p className="text-[clamp(0.75rem,1.4vw,0.95rem)] text-[var(--home-text-muted)]">
            Waiting for someone to arrive…
          </p>
        )}
        {players.map((p) => (
          <span
            key={p.id}
            className={`rounded-full border px-[clamp(0.6rem,1.5vw,1rem)] py-[clamp(0.2rem,0.6vh,0.35rem)] text-[clamp(0.7rem,1.3vw,0.9rem)] ${
              p.isHost
                ? 'border-[var(--home-magic)] text-[var(--home-magic)]'
                : 'border-[var(--home-border)] bg-[var(--home-surface)]'
            } ${p.connected ? '' : 'opacity-30'}`}
          >
            {p.name}
            {p.isHost && ' · host'}
          </span>
        ))}
      </div>
    </div>
  );
}

function Candle() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="animate-flame-flicker mb-[-3px] h-[clamp(12px,1.8vh,17px)] w-[clamp(8px,1.2vh,11px)] rounded-[50%_50%_50%_50%/65%_65%_35%_35%]"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #fff3c4, #f0973c 55%, #b9491f 100%)',
          boxShadow: '0 0 15px 4px rgba(240,151,60,0.5)',
        }}
      />
      <div className="h-[clamp(20px,3vh,28px)] w-[clamp(6px,0.9vh,8px)] rounded-sm bg-gradient-to-b from-[#ede4cf] to-[#c9b98f]" />
    </div>
  );
}

function CabinWindow() {
  return (
    <div
      className="relative h-[clamp(56px,9vh,84px)] w-[clamp(78px,13vh,118px)] overflow-hidden rounded-[50%_50%_8px_8px] border-[6px] border-[var(--home-border)] shadow-lg"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #171335 0%, var(--home-night-sky) 55%, #14110c 100%)',
        }}
      />
      <div
        className="absolute top-[14%] right-[16%] h-[22%] w-[15%] rounded-full"
        style={{
          background: 'radial-gradient(circle, #f3efe0, #cfc9ad 70%)',
          boxShadow: '0 0 14px 5px rgba(243,239,224,0.5)',
        }}
      />
      <div className="absolute -bottom-[10%] -left-[10%] h-[45%] w-[50%] rounded-full bg-[var(--home-garden-deep)]" />
      <div className="absolute -bottom-[10%] left-[22%] h-[36%] w-[40%] rounded-full bg-[var(--home-garden)] opacity-85" />
      <div className="absolute -bottom-[10%] -right-[12%] h-[43%] w-[46%] rounded-full bg-[var(--home-garden-deep)]" />
      <span className="animate-twinkle absolute top-[43%] left-[19%] h-[3px] w-[3px] rounded-full bg-[#e8f5a8] [box-shadow:0_0_6px_2px_rgba(232,245,168,0.8)]" />
      <span className="animate-twinkle absolute top-[60%] left-[58%] h-[3px] w-[3px] rounded-full bg-[#e8f5a8] [animation-delay:0.8s] [box-shadow:0_0_6px_2px_rgba(232,245,168,0.8)]" />
      <span className="animate-twinkle absolute top-[31%] left-[41%] h-[3px] w-[3px] rounded-full bg-[#e8f5a8] [animation-delay:1.6s] [box-shadow:0_0_6px_2px_rgba(232,245,168,0.8)]" />
    </div>
  );
}

function JoinCard({ code, joinUrl }: { code: string; joinUrl: string }) {
  return (
    <div className="flex w-[min(92vw,560px)] items-stretch rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-[clamp(0.6rem,1.6vh,1rem)] px-[clamp(0.9rem,2vw,1.6rem)] shadow-lg">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-[clamp(0.6rem,1vw,0.7rem)] tracking-widest text-[var(--home-text-muted)] uppercase">
          Join at
        </p>
        <p className="text-[clamp(0.75rem,1.4vw,0.9rem)] text-[var(--home-text-muted)]">
          gohomegames.com/join/
          <span className="mt-1 block text-[clamp(1.1rem,2.2vw,1.5rem)] font-bold tracking-widest text-[var(--home-magic)]">
            {code}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 self-stretch px-[clamp(0.75rem,2vw,1.25rem)]">
        <span className="w-px flex-1 bg-[var(--home-border)]" />
        <span className="text-[0.6rem] tracking-widest text-[var(--home-text-muted)] uppercase">
          or
        </span>
        <span className="w-px flex-1 bg-[var(--home-border)]" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-[clamp(0.6rem,1vw,0.7rem)] tracking-widest text-[var(--home-text-muted)] uppercase">
          Scan
        </p>
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={joinUrl} size={128} className="h-[clamp(72px,11vh,128px)] w-[clamp(72px,11vh,128px)]" />
        </div>
      </div>
    </div>
  );
}

function Door({
  label,
  magic,
  locked,
  labelClass,
  ref,
}: {
  label: string;
  magic?: boolean;
  locked?: boolean;
  labelClass?: string;
  ref?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-col items-center gap-[clamp(0.4rem,1.2vh,0.75rem)]">
      <div
        ref={ref}
        className={`relative h-[clamp(96px,18vh,142px)] w-[clamp(62px,11vh,92px)] rounded-[8px_8px_4px_4px] border-[3px] border-[var(--home-border)] ${
          locked ? 'opacity-60' : ''
        }`}
        style={{
          background: locked
            ? 'repeating-linear-gradient(90deg, #26221b, #2c281f 4px, #26221b 8px)'
            : 'repeating-linear-gradient(90deg, #332c22 0px, #3d3527 4px, #332c22 8px)',
        }}
      >
        <span className="absolute top-[52%] right-[10px] h-2 w-2 rounded-full bg-[#8a7a5a] [box-shadow:0_1px_0_rgba(255,255,255,0.2)_inset]" />
        {magic && (
          <>
            <span
              className="animate-portal-pulse pointer-events-none absolute -bottom-1.5 left-[10%] h-2.5 w-[80%] blur-[5px]"
              style={{
                background:
                  'radial-gradient(ellipse at center, var(--home-magic-glow), transparent 70%)',
              }}
            />
            <span
              className="animate-portal-pulse pointer-events-none absolute -inset-1 rounded-[inherit]"
              style={{ boxShadow: '0 0 20px 2px rgba(185,166,245,0.35)' }}
            />
            <span className="animate-spark-float absolute top-[30%] -left-1.5 h-1 w-1 rounded-full bg-[#e6defb] [box-shadow:0_0_8px_3px_rgba(230,222,251,0.85)]" />
            <span className="animate-spark-float absolute top-[55%] -right-2 h-1 w-1 rounded-full bg-[#e6defb] [animation-delay:1s] [box-shadow:0_0_8px_3px_rgba(230,222,251,0.85)]" />
            <span className="animate-spark-float absolute -top-2 left-[20%] h-1 w-1 rounded-full bg-[#e6defb] [animation-delay:2s] [box-shadow:0_0_8px_3px_rgba(230,222,251,0.85)]" />
          </>
        )}
      </div>
      {locked ? (
        <span className="text-[clamp(0.9rem,1.6vw,1.1rem)]">🔒</span>
      ) : (
        <p
          className={`font-serif text-[clamp(0.7rem,1.2vw,0.9rem)] font-bold tracking-widest uppercase ${
            labelClass ?? 'text-[var(--home-magic)]'
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
}
