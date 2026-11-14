import { useEffect, useRef, useState } from 'react';

import type { Player } from '@shared/party-types';

import { HomeWallBackdrop } from '@/app/components/home/home-wall-backdrop';
import { PlayerToken } from '@/app/components/player-token';

import { TAPS, tapCost, FALSE_START_MS, type MiniView, type PartyAction, type PartyView } from './definition';
import { MINI_INFO, placeLabel } from './minis';

// Party night, phone side. Between minigames the phone sits on Home's wood
// wall; during one it takes the minigame's window colour.

type Send = (a: PartyAction) => void;

const card = 'w-full max-w-xs rounded-3xl bg-[color-mix(in_srgb,var(--home-bg)_93%,transparent)] p-6 text-center';
const goldButton = 'home-gold-fill w-full max-w-xs rounded-2xl py-4 text-xl font-bold transition hover:brightness-110';

function Colour({ color }: { color: string }) {
  return <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: color }} aria-hidden="true" />;
}

const secs = (ms: number) => `${(ms / 1000).toFixed(3)} s`;

function QuickTap({ m, yourId, send }: { m: Extract<MiniView, { kind: 'quick-tap' }>; yourId: string; send: Send }) {
  const done = m.done[yourId] ?? 0;
  const [phase, setPhase] = useState<'ready' | 'wait' | 'go' | 'shown'>('ready');
  const [last, setLast] = useState<number | null>(null);
  const cueAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // After the last try, show its time for a moment, then the summary.
  useEffect(() => {
    if (phase !== 'shown' || done < TAPS) return;
    const t = setTimeout(() => setPhase('ready'), 1500);
    return () => clearTimeout(t);
  }, [phase, done]);

  const submit = (ms: number) => {
    setLast(ms);
    setPhase('shown');
    send({ type: 'tap', attempt: done, ms });
  };
  const press = () => {
    if (phase === 'ready' || phase === 'shown') {
      if (done >= TAPS) return;
      setPhase('wait');
      timer.current = setTimeout(() => {
        cueAt.current = performance.now();
        setPhase('go');
      }, m.delays[done]);
    } else if (phase === 'wait') {
      if (timer.current) clearTimeout(timer.current);
      submit(-1);
    } else if (phase === 'go') {
      submit(performance.now() - cueAt.current);
    }
  };

  if (done >= TAPS && phase !== 'shown') {
    return (
      <div className="text-center text-white">
        <p className="text-3xl font-bold">All done</p>
        <p className="mt-2 text-lg opacity-85">{m.best[yourId] !== null ? `Best ${secs(m.best[yourId]!)}` : 'All three were too early'}</p>
        <p className="mt-6 opacity-75">Waiting for the others…</p>
      </div>
    );
  }

  const gold = phase === 'go';
  const label =
    phase === 'wait' ? 'Wait…' : gold ? 'TAP!' : phase === 'shown' ? (done >= TAPS ? 'Done' : 'Next try') : 'Ready';
  const result =
    phase === 'shown' && last !== null
      ? tapCost(last) >= FALSE_START_MS
        ? last < 0 ? 'Too early!' : 'Too slow'
        : secs(last)
      : null;

  return (
    <div className="flex flex-col items-center text-center text-white">
      {gold && <Colour color="#e8a33d" />}
      <p className="text-sm font-semibold tracking-[0.15em] uppercase opacity-85">
        Try {Math.min(done + (phase === 'shown' ? 0 : 1), TAPS)} of {TAPS}
      </p>
      <p className="mt-2 h-10 text-3xl font-bold">{result ?? ''}</p>
      <button
        onPointerDown={phase === 'shown' && done >= TAPS ? undefined : press}
        className={`mt-6 h-64 w-64 touch-none rounded-full border-[10px] text-4xl font-bold tracking-wide select-none ${
          gold ? 'border-[#211d18] bg-[#211d18]/10 text-[#211d18]' : 'border-white bg-white/15'
        }`}
      >
        {label}
      </button>
      <p className="mt-6 max-w-xs opacity-80">
        {phase === 'wait' ? 'Tap when the screen turns gold. Not before!' : 'Press Ready, then wait for gold.'}
      </p>
    </div>
  );
}

// Holds the last reveal on screen for a moment before the next question.
function useHeldReveal(id: number | null) {
  const [held, setHeld] = useState<number | null>(null);
  const seen = useRef<number | null>(id);
  useEffect(() => {
    if (id === null || id === seen.current) return;
    seen.current = id;
    setHeld(id);
    const t = setTimeout(() => setHeld(null), 2600);
    return () => clearTimeout(t);
  }, [id]);
  return held !== null;
}

function Versus({ m, yourId, send }: { m: Extract<MiniView, { kind: 'versus' }>; yourId: string; send: Send }) {
  const holding = useHeldReveal(m.reveal?.id ?? null);
  const out = !m.alive.includes(yourId);
  const r = m.reveal;

  if (holding && r) {
    const right = r.question[r.question.answer];
    const wasWrong = r.wrongIds.includes(yourId);
    return (
      <div className="text-center text-white">
        <p className="text-4xl font-bold">{r.savedAll ? 'Everyone missed' : wasWrong ? 'Out!' : 'Right!'}</p>
        <p className="mt-3 text-lg opacity-90">
          {right.label}: {right.value}
        </p>
        {r.savedAll && <p className="mt-2 opacity-80">So everyone stays in.</p>}
      </div>
    );
  }
  if (out) {
    return (
      <div className="text-center text-white">
        <p className="text-3xl font-bold">You’re out</p>
        <p className="mt-2 opacity-85">Out on question {m.outAt[yourId] + 1}. Watch the TV.</p>
      </div>
    );
  }
  if (!m.question) return null;
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center text-white">
      <p className="text-sm font-semibold tracking-[0.15em] uppercase opacity-85">
        Question {m.index + 1} · {m.alive.length} standing
      </p>
      <p className="mt-2 text-2xl leading-snug font-bold">{m.question.prompt}</p>
      <div className="mt-8 grid w-full gap-4">
        {(['a', 'b'] as const).map((k) => (
          <button
            key={k}
            disabled={!!m.yourPick}
            onClick={() => send({ type: 'pick', choice: k })}
            className={`min-h-24 rounded-2xl px-4 text-2xl font-bold transition ${
              m.yourPick === k ? 'bg-white text-[#211d18]' : 'bg-white/15'
            } ${m.yourPick && m.yourPick !== k ? 'opacity-40' : ''}`}
          >
            {m.question![k].label}
          </button>
        ))}
      </div>
      <p className="mt-6 opacity-80">
        {m.yourPick ? `Locked in · ${m.answered.length} of ${m.alive.length}` : 'Pick one'}
      </p>
    </div>
  );
}

function SamePick({ m, yourId, send }: { m: Extract<MiniView, { kind: 'same-pick' }>; yourId: string; send: Send }) {
  const holding = useHeldReveal(m.reveal?.id ?? null);
  const r = m.reveal;
  if (holding && r) {
    const matched = r.scorers.includes(yourId);
    return (
      <div className="text-center text-white">
        <p className="text-4xl font-bold">{matched ? 'You matched!' : 'Not this time'}</p>
        <p className="mt-3 text-lg opacity-90">
          {r.top.length ? `The room picked ${r.top.map((i) => r.prompt.options[i]).join(' and ')}` : 'Everyone picked differently'}
        </p>
      </div>
    );
  }
  if (!m.prompt) return null;
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center text-white">
      <p className="text-sm font-semibold tracking-[0.15em] uppercase opacity-85">
        Question {m.index + 1} of {m.total}
      </p>
      <p className="mt-2 text-2xl font-bold">{m.prompt.prompt}</p>
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        {m.prompt.options.map((o, i) => (
          <button
            key={o}
            disabled={m.yourPick !== null}
            onClick={() => send({ type: 'choose', option: i })}
            className={`h-28 rounded-2xl px-2 text-xl font-bold transition ${
              m.yourPick === i ? 'bg-white text-[#211d18]' : 'bg-white/15'
            } ${m.yourPick !== null && m.yourPick !== i ? 'opacity-40' : ''}`}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="mt-6 opacity-80">
        {m.yourPick !== null ? `Locked in · ${m.answered.length} of ${Object.keys(m.score).length}` : 'Think like the room'}
      </p>
    </div>
  );
}

export function PartyNightPhone({ view, players, send }: { view: PartyView; players: Player[]; send: Send }) {
  const yourId = view.yourId!;
  const me = players.find((p) => p.id === yourId);
  const isHost = !!me?.isHost;
  const info = MINI_INFO[view.miniId];
  const myStep = view.steps[yourId] ?? 0;

  if (view.stage === 'play') {
    return (
      <div className="flex w-full flex-col items-center font-[family-name:var(--font-read)]">
        <Colour color={info.color} />
        <p className="mb-6 text-sm font-semibold tracking-[0.15em] text-white/85 uppercase">{info.name}</p>
        {view.mini.kind === 'quick-tap' && <QuickTap m={view.mini} yourId={yourId} send={send} />}
        {view.mini.kind === 'versus' && <Versus m={view.mini} yourId={yourId} send={send} />}
        {view.mini.kind === 'same-pick' && <SamePick m={view.mini} yourId={yourId} send={send} />}
        {isHost && (
          <button onClick={() => send({ type: 'skip' })} className="mt-10 text-sm text-white/70 underline underline-offset-4">
            Stop waiting for the others
          </button>
        )}
      </div>
    );
  }

  const placing = view.result?.placings.find((p) => p.id === yourId);
  return (
    <div className="flex w-full flex-col items-center gap-5 font-[family-name:var(--font-read)] text-[var(--home-text)]">
      <HomeWallBackdrop />
      {view.stage === 'intro' && (
        <div className={card}>
          <p className="text-sm text-[var(--home-text-muted)]">Minigame {view.round}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{info.name}</p>
          <p className="mt-3 text-lg leading-snug">{info.phone}</p>
          <span className="mx-auto mt-5 block h-2 w-16 rounded-full" style={{ background: info.color }} />
        </div>
      )}
      {(view.stage === 'results' || view.stage === 'over') && placing && (
        <div className={card}>
          <p className="text-sm text-[var(--home-text-muted)]">{view.result && MINI_INFO[view.result.mini].name}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-6xl font-bold text-[var(--home-gold)]">
            {placeLabel(placing.place)}
          </p>
          <p className="mt-2 text-xl font-semibold">
            {placing.gain ? `+${placing.gain} ${placing.gain === 1 ? 'step' : 'steps'}` : 'No steps this time'}
          </p>
          <p className="mt-1 text-[var(--home-text-muted)]">{placing.detail}</p>
        </div>
      )}
      {view.stage === 'over' ? (
        <div className={card}>
          <div className="flex justify-center gap-2">
            {view.winnerIds.map((id) => (
              <PlayerToken key={id} avatar={players.find((p) => p.id === id)?.avatar ?? ''} className="h-16 w-16" />
            ))}
          </div>
          <p className="mt-3 text-2xl font-bold">
            {view.winnerIds.includes(yourId) ? 'You win the night!' : `${view.winnerIds.map((id) => players.find((p) => p.id === id)?.name ?? '?').join(' and ')} won`}
          </p>
        </div>
      ) : (
        <p className="rounded-full bg-[color-mix(in_srgb,var(--home-bg)_85%,transparent)] px-5 py-2 text-lg">
          Step <b>{myStep}</b> of {view.goal}
        </p>
      )}
      {isHost && view.stage === 'intro' && (
        <button onClick={() => send({ type: 'go' })} className={goldButton}>
          Go
        </button>
      )}
      {isHost && view.stage === 'results' && (
        <button onClick={() => send({ type: 'next' })} className={goldButton}>
          Next minigame
        </button>
      )}
      {!isHost && view.stage !== 'over' && (
        <p className="text-[var(--home-text-muted)]">{view.stage === 'intro' ? 'Get ready…' : 'Watch the TV'}</p>
      )}
    </div>
  );
}
