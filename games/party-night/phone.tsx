import { useEffect, useRef, useState } from 'react';

import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

import { tokenColor } from '@/app/components/player-token';

import {
  FALSE_START_MS,
  GOAL_OPTIONS,
  MAX_BOTS,
  TAPS,
  TROPHY_OPTIONS,
  tapCost,
  type FinalReveal,
  type MiniView,
  type PartyAction,
  type PartyView,
  type Settings,
} from './definition';
import { Burst, CONFETTI, placeColor } from './celebrate';
import { LaneCells, PickleTrophy } from './lanes';
import { MINI_INFO, placeLabel } from './minis';
import { humanIds, useHeldReveal, usePeople, type Person } from './people';
import { PartyBackdrop } from './tv';

// Party night, phone side. Between minigames the phone shows Party night's
// stage (never Home's wood, so it's always clear you're in the game); during
// one it takes the minigame's window colour.

type Send = (a: PartyAction) => void;

const card = 'w-full max-w-xs rounded-3xl bg-[color-mix(in_srgb,var(--party-bg)_93%,transparent)] p-6 text-center';
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

// The big right/wrong moment on a phone: a disc that pops in, and confetti
// when it went your way.
function Verdict({ good, title, children }: { good: boolean; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center text-white">
      <span className="relative">
        <span
          className={`animate-party-pop flex h-28 w-28 items-center justify-center rounded-full text-6xl font-bold ${
            good ? 'bg-white text-[#1f6b3f]' : 'bg-black/25 text-white/80'
          }`}
        >
          {good ? '✓' : '✕'}
        </span>
        {good && <Burst colors={CONFETTI} reach="110px" piece="12px" delay={150} />}
      </span>
      <p className="animate-party-rise mt-6 text-4xl font-bold [animation-delay:200ms]">{title}</p>
      <div className="animate-party-rise mt-3 text-lg opacity-90 [animation-delay:350ms]">{children}</div>
    </div>
  );
}

function Versus({ m, yourId, send }: { m: Extract<MiniView, { kind: 'versus' }>; yourId: string; send: Send }) {
  const holding = useHeldReveal(m.reveal?.id ?? null);
  const out = !m.alive.includes(yourId);
  const r = m.reveal;

  if (holding && r && (!out || r.wrongIds.includes(yourId))) {
    const right = r.question[r.question.answer];
    const wasWrong = r.wrongIds.includes(yourId);
    return (
      <Verdict good={!wasWrong && !r.savedAll} title={r.savedAll ? 'Everyone missed' : wasWrong ? 'Knocked out!' : 'Right!'}>
        <p>
          {right.label}: {right.value}
        </p>
        {r.savedAll && <p className="mt-2 opacity-80">So everyone stays in.</p>}
      </Verdict>
    );
  }
  if (out) {
    return (
      <div className="text-center text-white">
        <p className="text-3xl font-bold">Knocked out</p>
        <p className="mt-2 opacity-85">On question {m.outAt[yourId] + 1}. Watch the TV.</p>
      </div>
    );
  }
  if (!m.question) return null;
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center text-white">
      <p className="text-sm font-semibold tracking-[0.15em] uppercase opacity-85">
        Question {m.index + 1} · {m.alive.length} still in
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
      <Verdict good={matched} title={matched ? 'You matched!' : 'Not this time'}>
        {r.top.length ? `The room picked ${r.top.map((i) => r.prompt.options[i]).join(' and ')}` : 'Everyone picked differently'}
      </Verdict>
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

function Closest({ m, yourId, send }: { m: Extract<MiniView, { kind: 'closest' }>; yourId: string; send: Send }) {
  const holding = useHeldReveal(m.reveal?.id ?? null);
  const [value, setValue] = useState(40);
  const r = m.reveal;
  if (holding && r) return <ClosestResult r={r} yourId={yourId} />;
  if (m.index >= m.total) return null;
  const bump = (d: number) => setValue((v) => Math.max(0, Math.min(999, v + d)));
  const locked = m.yourGuess !== null;
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center text-white">
      <p className="text-sm font-semibold tracking-[0.15em] uppercase opacity-85">
        Round {m.index + 1} of {m.total}
      </p>
      <p className="mt-2 text-2xl font-bold">{locked ? 'Locked in' : 'How many dots on the TV?'}</p>
      <input
        type="number"
        inputMode="numeric"
        disabled={locked}
        value={locked ? m.yourGuess! : value}
        onChange={(e) => setValue(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
        className="mt-6 w-40 rounded-2xl bg-white/15 py-3 text-center text-6xl font-bold outline-none [appearance:textfield] focus:bg-white/25 [&::-webkit-inner-spin-button]:appearance-none"
      />
      {!locked && (
        <>
          <div className="mt-4 grid w-full grid-cols-4 gap-2">
            {[-10, -1, 1, 10].map((d) => (
              <button key={d} onClick={() => bump(d)} className="rounded-xl bg-white/15 py-3 text-xl font-bold active:bg-white/30">
                {d > 0 ? `+${d}` : `−${-d}`}
              </button>
            ))}
          </div>
          <button onClick={() => send({ type: 'guess', value })} className="mt-6 w-full rounded-2xl bg-white py-4 text-xl font-bold text-[#1d3b2a]">
            Lock in {value}
          </button>
        </>
      )}
      <p className="mt-6 opacity-80">{locked ? `${m.answered.length} guessed so far` : 'Look at the TV, not your phone'}</p>
    </div>
  );
}

function ClosestResult({ r, yourId }: { r: Extract<FinalReveal, { kind: 'closest' }>['reveal']; yourId: string }) {
  const g = r.guesses[yourId];
  const off = g === undefined ? Infinity : Math.abs(g - r.answer);
  // Closest in the room, or within a tenth of the answer, counts as a hit.
  const best = Math.min(...Object.values(r.guesses).map((x) => Math.abs(x - r.answer)));
  const good = off === best || off <= Math.max(1, Math.round(r.answer / 10));
  return (
    <Verdict good={good} title={off === 0 ? 'Spot on!' : off === best ? 'Closest!' : good ? 'So close!' : `There were ${r.answer}`}>
      {g === undefined ? 'You didn’t guess' : `There were ${r.answer}. You said ${g}.`}
    </Verdict>
  );
}

// The final answer of a minigame, on the phone, before its scores.
function FinalLine({ final, yourId }: { final: FinalReveal; yourId: string }) {
  if (final.kind === 'closest') {
    const g = final.reveal.guesses[yourId];
    return <>There were {final.reveal.answer}{g !== undefined ? `, you said ${g}` : ''}.</>;
  }
  if (final.kind === 'versus') {
    const q = final.reveal.question;
    return <>Last answer: {q[q.answer].label} ({q[q.answer].value}).</>;
  }
  const r = final.reveal;
  return <>{r.top.length ? `The room picked ${r.top.map((i) => r.prompt.options[i]).join(' and ')}.` : 'Everyone picked differently.'}</>;
}

const chip = (on: boolean) =>
  `flex-1 rounded-xl py-3 text-lg font-bold transition ${on ? 'home-gold-fill' : 'bg-white/10 text-[var(--party-text)]'}`;

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button disabled={value <= min} onClick={() => onChange(value - 1)} className="h-11 w-11 rounded-xl bg-white/10 text-2xl font-bold disabled:opacity-30">
        −
      </button>
      <span className="w-8 text-center text-2xl font-bold">{value}</span>
      <button disabled={value >= max} onClick={() => onChange(value + 1)} className="h-11 w-11 rounded-xl bg-white/10 text-2xl font-bold disabled:opacity-30">
        +
      </button>
    </div>
  );
}

function Setup({ view, players, isHost, send }: { view: PartyView; players: Player[]; isHost: boolean; send: Send }) {
  const s = view.settings;
  const host = players.find((p) => p.isHost);
  if (!isHost) {
    return (
      <div className="flex w-full flex-col items-center gap-5 font-[family-name:var(--font-read)] text-[var(--party-text)]">
        <PartyBackdrop />
        <div className={card}>
          <p className="text-sm tracking-[0.2em] text-[var(--party-text-muted)] uppercase">The Pickle</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">Almost ready</p>
          <p className="mt-3 text-lg">{host?.name ?? 'The host'} is choosing the rules.</p>
          <p className="mt-3 text-[var(--party-text-muted)]">
            {s.goal} points for a trophy · first to {s.trophies}
          </p>
        </div>
      </div>
    );
  }
  const set = (patch: Partial<Settings>) => send({ type: 'settings', settings: patch });
  const total = players.length + s.bots;
  const row = 'flex items-center justify-between gap-3';
  return (
    <div className="flex w-full flex-col items-center gap-4 font-[family-name:var(--font-read)] text-[var(--party-text)]">
      <PartyBackdrop />
      <div className={`${card} space-y-5 text-left`}>
        <div className="text-center">
          <p className="text-sm tracking-[0.2em] text-[var(--party-text-muted)] uppercase">The Pickle</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">Choose the rules</p>
        </div>
        <div>
          <p className="mb-2 font-semibold">Points for a trophy</p>
          <div className="flex gap-2">
            {GOAL_OPTIONS.map((g) => (
              <button key={g} onClick={() => set({ goal: g })} className={chip(s.goal === g)}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-semibold">Trophies to win</p>
          <div className="flex gap-2">
            {TROPHY_OPTIONS.map((t) => (
              <button key={t} onClick={() => set({ trophies: t })} className={chip(s.trophies === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className={row}>
            <p className="font-semibold">Last sprint</p>
            <button onClick={() => set({ sprint: !s.sprint })} className={`rounded-full px-4 py-1.5 font-bold ${s.sprint ? 'home-gold-fill' : 'bg-white/10'}`}>
              {s.sprint ? 'On' : 'Off'}
            </button>
          </div>
          {s.sprint && (
            <div className={`${row} mt-2`}>
              <p className="text-sm text-[var(--party-text-muted)]">Starts after</p>
              <Stepper value={s.line} min={1} max={s.goal - 1} onChange={(n) => set({ line: n })} />
            </div>
          )}
          <p className="mt-1 text-sm text-[var(--party-text-muted)]">
            {s.sprint ? 'Past the line, the bottom places lose points.' : 'Nobody loses points.'}
          </p>
        </div>
        <div className="border-t border-white/10 pt-4">
          <div className={row}>
            <p className="font-semibold">Test bots</p>
            <Stepper value={s.bots} min={0} max={MAX_BOTS} onChange={(n) => set({ bots: n })} />
          </div>
          <p className="mt-1 text-sm text-[var(--party-text-muted)]">Computer players that answer on their own. For trying it out.</p>
        </div>
      </div>
      <button disabled={total < 2} onClick={() => send({ type: 'begin' })} className={`${goldButton} disabled:opacity-40`}>
        Let’s go
      </button>
      {total < 2 && <p className="text-[var(--party-text-muted)]">Add a bot or a player first.</p>}
    </div>
  );
}

function MyLane({ view, me, change }: { view: PartyView; me: Person; change: number }) {
  const id = view.yourId!;
  const trophies = view.trophies[id] ?? 0;
  return (
    <div className={`${card} py-4`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">Your points</span>
        <span className="flex items-center gap-1">
          {Array.from({ length: view.settings.trophies }, (_, i) => (
            <PickleTrophy key={i} className={`h-9 w-5 ${i < trophies ? '' : 'opacity-20 grayscale'}`} />
          ))}
        </span>
      </div>
      <LaneCells
        color={tokenColor(me.avatar)}
        points={view.points[id] ?? 0}
        change={change}
        goal={view.settings.goal}
        line={view.settings.line}
        sprint={view.settings.sprint}
        height="22px"
        font="12px"
      />
    </div>
  );
}

export function PartyNightPhone({ view, players, send }: { view: PartyView; players: Player[]; send: Send }) {
  const yourId = view.yourId!;
  const who = usePeople(view, players);
  const isHost = !!players.find((p) => p.id === yourId)?.isHost;
  const info = MINI_INFO[view.miniId];

  if (view.stage === 'setup') return <Setup view={view} players={players} isHost={isHost} send={send} />;

  if (view.stage === 'play') {
    return (
      <div className="flex w-full flex-col items-center font-[family-name:var(--font-read)]">
        <Colour color={info.color} />
        <p className="mb-6 text-sm font-semibold tracking-[0.15em] text-white/85 uppercase">{info.name}</p>
        {view.mini.kind === 'quick-tap' && <QuickTap m={view.mini} yourId={yourId} send={send} />}
        {view.mini.kind === 'versus' && <Versus m={view.mini} yourId={yourId} send={send} />}
        {view.mini.kind === 'same-pick' && <SamePick m={view.mini} yourId={yourId} send={send} />}
        {view.mini.kind === 'closest' && <Closest m={view.mini} yourId={yourId} send={send} />}
        {isHost && (
          <button onClick={() => send({ type: 'skip' })} className="mt-10 text-sm text-white/70 underline underline-offset-4">
            Stop waiting for the others
          </button>
        )}
      </div>
    );
  }

  const result = view.result;
  const placing = result?.placings.find((p) => p.id === yourId);
  const gotTrophy = !!result?.trophyIds.includes(yourId);
  const humans = humanIds(view);
  const change = gotTrophy ? 0 : (placing?.change ?? 0);
  return (
    <div className="flex w-full flex-col items-center gap-5 font-[family-name:var(--font-read)] text-[var(--party-text)]">
      <PartyBackdrop />
      {view.stage === 'over' && (
        <div className={card}>
          <div className="flex justify-center gap-2">
            {view.winnerIds.map((id) => (
              <PlayerToken key={id} avatar={who(id).avatar} className="h-16 w-16" />
            ))}
          </div>
          <p className="mt-3 text-2xl font-bold">
            {view.winnerIds.includes(yourId) ? 'You win the pickle!' : `${view.winnerIds.map((id) => who(id).name).join(' and ')} won the pickle`}
          </p>
        </div>
      )}
      {(view.stage === 'results' || view.stage === 'over') && placing && result && (
        <div className={card}>
          <p className="text-sm text-[var(--party-text-muted)]">{MINI_INFO[result.mini].name}</p>
          {gotTrophy ? (
            <div className="mt-2 flex flex-col items-center">
              <PickleTrophy className="h-24 w-14" />
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--home-gold)]">Trophy!</p>
            </div>
          ) : (
            <>
              <p className="relative mt-1 font-[family-name:var(--font-display)] text-6xl font-bold" style={{ color: placeColor(placing.place) }}>
                <span className="animate-party-pop inline-block">{placing.place === 1 ? 'You won!' : placeLabel(placing.place)}</span>
                {placing.place === 1 && <Burst colors={CONFETTI} reach="120px" piece="12px" delay={150} />}
              </p>
              <p className="mt-2 text-xl font-semibold" style={{ color: change < 0 ? '#ff9f8a' : undefined }}>
                {change > 0 ? `+${change} points` : change < 0 ? `−${-change} points` : 'No points this time'}
              </p>
            </>
          )}
          <p className="mt-1 text-[var(--party-text-muted)]">{placing.detail}</p>
          {result.final && (
            <p className="mt-2 text-sm text-[var(--party-text-muted)]">
              <FinalLine final={result.final} yourId={yourId} />
            </p>
          )}
        </div>
      )}
      {view.stage !== 'over' && <MyLane view={view} me={who(yourId)} change={change} />}
      {(view.stage === 'intro' || view.stage === 'results') && (
        <>
          <div className={card}>
            <p className="text-sm text-[var(--party-text-muted)]">
              {view.stage === 'results' ? 'Up next · ' : ''}Minigame {view.round}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{info.name}</p>
            <p className="mt-3 text-lg leading-snug">{info.phone}</p>
            <span className="mx-auto mt-5 block h-2 w-16 rounded-full" style={{ background: info.color }} />
          </div>
          <div className="flex w-full flex-col items-center gap-3">
            {view.ready.includes(yourId) ? (
              <p className="rounded-2xl border border-[var(--home-gold)] px-6 py-4 text-xl font-bold text-[var(--home-gold)]">
                Ready · {view.ready.length} of {humans.length}
              </p>
            ) : (
              <button onClick={() => send({ type: 'ready' })} className={goldButton}>
                Ready
              </button>
            )}
            {isHost && view.ready.length < humans.length && (
              <button onClick={() => send({ type: 'go' })} className="text-sm text-[var(--party-text-muted)] underline underline-offset-4">
                Start without everyone
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
