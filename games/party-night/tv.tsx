import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

import { TAPS, type PartyView } from './definition';
import { MINI_INFO, placeLabel } from './minis';
import { Tower } from './tower';

// Party night on the TV: whatever is happening now on the left, the tower
// everyone climbs on the right. Home's warm dark room; colour comes only from
// the minigame's window and the players' tokens.

// Party night's stage: dark, with two soft spotlights crossing onto the floor.
// Shared by the TV and by phones between minigames.
export function PartyBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--party-bg)]" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent,rgba(54,61,99,0.35))]" />
      <div className="absolute bottom-[-20%] left-1/2 h-[55%] w-[110%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(246,226,168,0.16),transparent_65%)]" />
      <div className="absolute top-[-10%] left-[8%] h-[130%] w-[34%] origin-top rotate-[-18deg] bg-[linear-gradient(180deg,rgba(220,225,255,0.13),transparent_80%)] [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)]" />
      <div className="absolute top-[-10%] right-[8%] h-[130%] w-[34%] origin-top rotate-[18deg] bg-[linear-gradient(180deg,rgba(220,225,255,0.13),transparent_80%)] [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_50%,rgba(0,0,0,0.55))]" />
    </div>
  );
}

function Window({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-[2.4vh] p-[3.4vh] text-white shadow-[0_2vh_5vh_rgba(0,0,0,0.55)]"
      style={{ background: color }}
    >
      {children}
    </div>
  );
}

function Who({ id, players, children }: { id: string; players: Player[]; children?: React.ReactNode }) {
  const p = players.find((x) => x.id === id);
  return (
    <span className="flex items-center gap-[0.8vw] text-[2.8vh] font-semibold">
      <PlayerToken avatar={p?.avatar ?? ''} className="h-[4.4vh] w-[4.4vh]" />
      <span className="flex-1">{p?.name ?? '?'}</span>
      {children}
    </span>
  );
}

function ReadyRow({ view, players }: { view: PartyView; players: Player[] }) {
  return (
    <div className="mt-[3vh] flex items-center gap-[1.4vw]">
      <span className="flex gap-[0.8vw]">
        {view.order.map((id) => {
          const ready = view.ready.includes(id);
          return (
            <span key={id} className="relative transition-opacity duration-500" style={{ opacity: ready ? 1 : 0.35 }}>
              <PlayerToken avatar={players.find((p) => p.id === id)?.avatar ?? ''} className="h-[5vh] w-[5vh]" />
              {ready && (
                <span className="absolute -right-[0.6vh] -bottom-[0.4vh] flex h-[2.4vh] w-[2.4vh] items-center justify-center rounded-full bg-[var(--home-gold)] text-[1.6vh] font-bold text-[#211d18]">
                  ✓
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className="text-[2.6vh] text-[var(--party-text-muted)]">
        Tap Ready on your phone · {view.ready.length} of {view.order.length}
      </span>
    </div>
  );
}

function PlayBody({ view, players }: { view: PartyView; players: Player[] }) {
  const m = view.mini;
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  if (m.kind === 'quick-tap') {
    return (
      <>
        <p className="mb-[3vh] text-[4.4vh] leading-tight font-bold">Watch your phone, not the TV</p>
        <ul className="space-y-[1.6vh]">
          {view.order.map((id) => (
            <li key={id}>
              <Who id={id} players={players}>
                <span className="flex gap-[0.5vw]">
                  {Array.from({ length: TAPS }, (_, i) => (
                    <span
                      key={i}
                      className={`h-[2vh] w-[2vh] rounded-full ${i < m.done[id] ? 'bg-white' : 'border-[0.3vh] border-white/50'}`}
                    />
                  ))}
                </span>
                <span className="w-[8vw] text-right text-[2.4vh] opacity-85">
                  {m.best[id] !== null ? `${(m.best[id]! / 1000).toFixed(3)} s` : ''}
                </span>
              </Who>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (m.kind === 'versus') {
    const r = m.reveal;
    return (
      <>
        {m.question && (
          <>
            <p className="text-[2.2vh] tracking-[0.2em] uppercase opacity-80">
              Question {m.index + 1} · {m.alive.length} still in
            </p>
            <p className="mt-[1vh] mb-[2.4vh] text-[4.6vh] leading-tight font-bold">{m.question.prompt}</p>
            <div className="grid grid-cols-2 gap-[1.6vw]">
              {(['a', 'b'] as const).map((k) => (
                <div key={k} className="rounded-[1.6vh] bg-white/15 p-[2.4vh] text-center text-[3.6vh] font-bold">
                  {m.question![k].label}
                </div>
              ))}
            </div>
            <p className="mt-[2vh] text-[2.4vh] opacity-85">
              {m.answered.length} of {m.alive.length} locked in
            </p>
          </>
        )}
        {r && (
          <p className="mt-[2.4vh] rounded-[1.4vh] bg-black/20 p-[1.8vh] text-[2.4vh] leading-snug">
            Last one: <b>{r.question[r.question.answer].label}</b> ({r.question[r.question.answer].value}) beat{' '}
            {r.question[r.question.answer === 'a' ? 'b' : 'a'].label} ({r.question[r.question.answer === 'a' ? 'b' : 'a'].value}).{' '}
            {r.savedAll
              ? 'Everyone got it wrong, so everyone stays.'
              : r.wrongIds.length
                ? `Knocked out: ${r.wrongIds.map(nameOf).join(', ')}.`
                : 'Nobody out.'}
          </p>
        )}
      </>
    );
  }

  const r = m.reveal;
  return (
    <>
      {m.prompt && (
        <>
          <p className="text-[2.2vh] tracking-[0.2em] uppercase opacity-80">
            Question {m.index + 1} of {m.total}
          </p>
          <p className="mt-[1vh] mb-[2.4vh] text-[4.6vh] leading-tight font-bold">{m.prompt.prompt}</p>
          <div className="grid grid-cols-2 gap-[1.2vw]">
            {m.prompt.options.map((o) => (
              <div key={o} className="rounded-[1.6vh] bg-white/15 p-[2vh] text-center text-[3.2vh] font-bold">
                {o}
              </div>
            ))}
          </div>
          <p className="mt-[2vh] text-[2.4vh] opacity-85">
            {m.answered.length} of {view.order.length} locked in
          </p>
        </>
      )}
      {r && (
        <p className="mt-[2.4vh] rounded-[1.4vh] bg-black/20 p-[1.8vh] text-[2.4vh] leading-snug">
          Last one: {r.prompt.prompt}{' '}
          {r.top.length ? (
            <>
              The room picked <b>{r.top.map((i) => r.prompt.options[i]).join(' and ')}</b>. Matched:{' '}
              {r.scorers.map(nameOf).join(', ')}.
            </>
          ) : (
            'Everyone picked differently, so nobody scored.'
          )}
        </p>
      )}
    </>
  );
}

export function PartyNightTv({ view, players }: { view: PartyView; players: Player[] }) {
  const info = MINI_INFO[view.miniId];
  const gains = view.stage === 'results' || view.stage === 'over'
    ? Object.fromEntries((view.result?.placings ?? []).map((p) => [p.id, p.gain]))
    : {};

  let left: React.ReactNode;
  if (view.stage === 'over') {
    const names = view.winnerIds.map((id) => players.find((p) => p.id === id)?.name ?? '?');
    left = (
      <div className="flex flex-col items-start gap-[3vh]">
        <p className="text-[2.4vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">Party night</p>
        <div className="flex gap-[1vw]">
          {view.winnerIds.map((id) => (
            <PlayerToken key={id} avatar={players.find((p) => p.id === id)?.avatar ?? ''} className="h-[12vh] w-[12vh]" />
          ))}
        </div>
        <p className="font-[family-name:var(--font-display)] text-[9vh] leading-none font-bold text-[var(--home-gold)]">
          {names.join(' and ')} {names.length > 1 ? 'win!' : 'wins!'}
        </p>
        <p className="text-[3vh] text-[var(--party-text-muted)]">First to the top, after {view.round} minigames.</p>
      </div>
    );
  } else if (view.stage === 'results' && view.result) {
    left = (
      <div className="w-full">
        <p className="mb-[2vh] text-[2.4vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">
          {MINI_INFO[view.result.mini].name} · results
        </p>
        <ul className="space-y-[1.8vh]">
          {view.result.placings.map((p) => (
            <li key={p.id} className="flex items-center gap-[1.2vw]">
              <span className="w-[4vw] font-[family-name:var(--font-display)] text-[4.4vh] font-bold text-[var(--home-brass)]">
                {placeLabel(p.place)}
              </span>
              <span className="flex-1">
                <Who id={p.id} players={players}>
                  <span className="text-[2.4vh] font-normal text-[var(--party-text-muted)]">{p.detail}</span>
                </Who>
              </span>
              <span className="w-[7vw] text-right text-[3.4vh] font-bold text-[var(--home-gold)]">
                {p.gain ? `+${p.gain}` : ''}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-[4vh] flex items-center gap-[1.2vw]">
          <span className="text-[2.2vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">Up next</span>
          <span className="rounded-[1.2vh] px-[1.4vw] py-[0.8vh] text-[3vh] font-bold text-white" style={{ background: info.color }}>
            {info.name}
          </span>
        </div>
        <ReadyRow view={view} players={players} />
      </div>
    );
  } else if (view.stage === 'intro') {
    left = (
      <div className="w-full">
        <p className="mb-[2vh] text-[2.4vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">
          Minigame {view.round}
        </p>
        <Window color={info.color}>
          <p className="font-[family-name:var(--font-display)] text-[8vh] leading-none font-bold">{info.name}</p>
          <ol className="mt-[3.4vh] space-y-[1.6vh]">
            {info.rules.map((r, i) => (
              <li key={r} className="flex gap-[1vw] text-[3.2vh] leading-snug">
                <span className="font-bold opacity-70">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
        </Window>
        <ReadyRow view={view} players={players} />
        <p className="mt-[1vh] text-[2.2vh] text-[var(--party-text-muted)]">1st climbs 3 steps · 2nd climbs 2 · 3rd climbs 1</p>
      </div>
    );
  } else {
    left = (
      <div className="w-full">
        <p className="mb-[2vh] text-[2.4vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">
          Minigame {view.round} · {info.name}
        </p>
        <Window color={info.color}>
          <PlayBody view={view} players={players} />
        </Window>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center gap-[5vw] px-[6vw] py-[5vh] font-[family-name:var(--font-read)] text-[var(--party-text)] select-none">
      <PartyBackdrop />
      <div className="flex flex-1 items-center">
        <div key={`${view.stage}-${view.round}`} className="animate-home-fade w-full">
          {left}
        </div>
      </div>
      <Tower order={view.order} steps={view.steps} goal={view.goal} players={players} gains={gains} />
    </div>
  );
}
