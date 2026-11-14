import { useEffect, useState } from 'react';

import type { Player } from '@shared/party-types';

import { PlayerToken } from '@/app/components/player-token';

import { TAPS, type FinalReveal, type MiniView, type PartyView } from './definition';
import { Lanes, Trophy } from './lanes';
import { DOTS_SHOWN_MS, MINI_INFO } from './minis';
import { humanIds, useHeldReveal, usePeople, type Person } from './people';

// Party night on the TV: its own dark stage, so it never looks like Home.
// Colour comes only from the minigame's window and the players' tokens.

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

type Who = (id: string) => Person;

function Window({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="w-full rounded-[2.4vh] p-[3.4vh] text-white shadow-[0_2vh_5vh_rgba(0,0,0,0.55)]" style={{ background: color }}>
      {children}
    </div>
  );
}

function Row({ person, children }: { person: Person; children?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-[0.8vw] text-[2.8vh] font-semibold">
      <PlayerToken avatar={person.avatar} className="h-[4.4vh] w-[4.4vh]" />
      <span className="flex-1">{person.name}</span>
      {children}
    </span>
  );
}

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[2.4vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">{children}</p>
);

function ReadyRow({ view, who }: { view: PartyView; who: Who }) {
  const ids = humanIds(view);
  return (
    <div className="flex items-center gap-[1.4vw]">
      <span className="flex gap-[0.8vw]">
        {ids.map((id) => {
          const ready = view.ready.includes(id);
          return (
            <span key={id} className="relative transition-opacity duration-500" style={{ opacity: ready ? 1 : 0.35 }}>
              <PlayerToken avatar={who(id).avatar} className="h-[5vh] w-[5vh]" />
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
        Tap Ready on your phone · {view.ready.length} of {ids.length}
      </span>
    </div>
  );
}

// The dots flash up for a few seconds after any reveal has had its moment.
function DotWindow({ m }: { m: Extract<MiniView, { kind: 'closest' }> }) {
  const [shown, setShown] = useState(true);
  const [left, setLeft] = useState(DOTS_SHOWN_MS / 1000);
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => {
      const remaining = DOTS_SHOWN_MS - (Date.now() - started);
      setLeft(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0) {
        setShown(false);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <p className="text-[2.2vh] tracking-[0.2em] uppercase opacity-80">
        Round {m.index + 1} of {m.total} · {shown ? `${left}…` : `${m.answered.length} guessed`}
      </p>
      <p className="mt-[1vh] mb-[2vh] text-[4.4vh] leading-tight font-bold">{shown ? 'How many dots?' : 'Guess on your phone'}</p>
      <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-[1.6vh] bg-black/25">
        {shown ? (
          m.field?.dots.map(([x, y], i) => (
            <span
              key={i}
              className="absolute h-[2.2vh] w-[2.2vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[12vh] font-bold opacity-30">?</span>
        )}
      </div>
    </>
  );
}

// A question's answer, shown for a moment before the next one (or the scores).
function Reveal({ final, view, who }: { final: FinalReveal; view: PartyView; who: Who }) {
  const names = (ids: string[]) => ids.map((id) => who(id).name).join(', ');
  let inner: React.ReactNode;
  if (final.kind === 'versus') {
    const r = final.reveal;
    const right = r.question[r.question.answer];
    const wrong = r.question[r.question.answer === 'a' ? 'b' : 'a'];
    inner = (
      <>
        <p className="opacity-80">{r.question.prompt}</p>
        <p className="mt-[1vh] text-[4.4vh] font-bold">
          {right.label} <span className="font-normal opacity-80">({right.value})</span>
        </p>
        <p className="opacity-80">
          beats {wrong.label} ({wrong.value})
        </p>
        <p className="mt-[1.6vh] font-semibold">
          {r.savedAll ? 'Everyone got it wrong, so everyone stays.' : r.wrongIds.length ? `Knocked out: ${names(r.wrongIds)}` : 'Nobody out.'}
        </p>
      </>
    );
  } else if (final.kind === 'same-pick') {
    const r = final.reveal;
    inner = (
      <>
        <p className="opacity-80">{r.prompt.prompt}</p>
        {r.top.length ? (
          <>
            <p className="mt-[1vh] text-[4.4vh] font-bold">{r.top.map((i) => r.prompt.options[i]).join(' and ')}</p>
            <p className="mt-[1.6vh] font-semibold">Matched: {names(r.scorers)}</p>
          </>
        ) : (
          <p className="mt-[1vh] text-[4vh] font-bold">Everyone picked differently</p>
        )}
      </>
    );
  } else {
    const r = final.reveal;
    const off = (id: string) => (r.guesses[id] === undefined ? 1e6 : Math.abs(r.guesses[id] - r.answer));
    const sorted = [...view.order].sort((x, y) => off(x) - off(y));
    inner = (
      <>
        <p className="text-[5vh] font-bold">There were {r.answer}</p>
        <ul className="mt-[1.6vh] space-y-[1vh]">
          {sorted.map((id) => (
            <li key={id}>
              <Row person={who(id)}>
                <span className="text-[2.6vh] font-normal">
                  {r.guesses[id] ?? '–'}
                  {r.guesses[id] !== undefined && <span className="opacity-70"> · off by {off(id)}</span>}
                </span>
              </Row>
            </li>
          ))}
        </ul>
      </>
    );
  }
  return <div className="animate-home-fade rounded-[1.4vh] bg-black/20 p-[2.4vh] text-[3vh] leading-snug">{inner}</div>;
}

function PlayBody({ view, who }: { view: PartyView; who: Who }) {
  const m = view.mini;
  const revealId = m.kind === 'quick-tap' ? null : (m.reveal?.id ?? null);
  const holding = useHeldReveal(revealId, 3200);

  if (m.kind === 'quick-tap') {
    return (
      <>
        <p className="mb-[3vh] text-[4.4vh] leading-tight font-bold">Watch your phone, not the TV</p>
        <ul className="space-y-[1.6vh]">
          {view.order.map((id) => (
            <li key={id}>
              <Row person={who(id)}>
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
              </Row>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (holding && m.reveal) return <Reveal final={{ kind: m.kind, reveal: m.reveal } as FinalReveal} view={view} who={who} />;

  if (m.kind === 'versus') {
    if (!m.question) return null;
    return (
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
    );
  }

  if (m.kind === 'same-pick') {
    if (!m.prompt) return null;
    return (
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
    );
  }

  if (!m.field) return null;
  return <DotWindow key={m.index} m={m} />;
}

// The last answer gets its moment, then the scores take over.
function FinalThenScores({ final, view, who, children }: { final: FinalReveal; view: PartyView; who: Who; children: React.ReactNode }) {
  const [held, setHeld] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setHeld(false), 3200);
    return () => clearTimeout(t);
  }, []);
  if (!held) return <div className="animate-home-fade h-full w-full">{children}</div>;
  const info = MINI_INFO[final.kind];
  return (
    <div className="mx-auto flex w-[62vw] flex-col gap-[2vh]">
      <Kicker>{info.name} · last answer</Kicker>
      <Window color={info.color}>
        <Reveal final={final} view={view} who={who} />
      </Window>
    </div>
  );
}

function UpNext({ view, who }: { view: PartyView; who: Who }) {
  const info = MINI_INFO[view.miniId];
  return (
    <div className="flex items-center gap-[1.4vw]">
      <span className="text-[2.2vh] tracking-[0.3em] text-[var(--party-text-muted)] uppercase">Up next</span>
      <span className="rounded-[1.2vh] px-[1.4vw] py-[0.8vh] text-[3vh] font-bold text-white" style={{ background: info.color }}>
        {info.name}
      </span>
      <ReadyRow view={view} who={who} />
    </div>
  );
}

function TrophySide({ view }: { view: PartyView }) {
  return (
    <div className="flex w-[14vw] shrink-0 flex-col items-center gap-[1.4vh] text-center">
      <div className="relative">
        <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(246,226,168,0.3),transparent_65%)]" />
        <Trophy className="relative h-[20vh] w-[17vh] drop-shadow-[0_1vh_1.6vh_rgba(0,0,0,0.6)]" />
      </div>
      <span className="text-[2.8vh] font-semibold text-[#e8c97a]">{view.settings.goal} for a trophy</span>
      <span className="text-[2.4vh] text-[var(--party-text-muted)]">
        First to {view.settings.trophies} {view.settings.trophies === 1 ? 'trophy' : 'trophies'} wins
      </span>
    </div>
  );
}

export function PartyNightTv({ view, players }: { view: PartyView; players: Player[] }) {
  const who = usePeople(view, players);
  const info = MINI_INFO[view.miniId];
  const host = players.find((p) => p.isHost);
  let body: React.ReactNode;

  if (view.stage === 'setup') {
    const s = view.settings;
    body = (
      <div className="flex w-full items-center gap-[5vw]">
        <div className="flex flex-1 flex-col gap-[3vh]">
          <Kicker>Party night</Kicker>
          <p className="font-[family-name:var(--font-display)] text-[8vh] leading-none font-bold">Setting up the night</p>
          <p className="text-[3.2vh] text-[var(--party-text-muted)]">{host?.name ?? 'The host'} is choosing the rules on their phone.</p>
          <ul className="mt-[1vh] space-y-[1.4vh] text-[3.2vh]">
            <li>
              <b>{s.goal}</b> points for a trophy, first to <b>{s.trophies}</b> {s.trophies === 1 ? 'trophy' : 'trophies'} wins
            </li>
            <li>{s.sprint ? <>Last sprint after <b>{s.line}</b>: the bottom places lose points</> : 'No last sprint'}</li>
            {s.bots > 0 && (
              <li>
                Test mode: <b>{s.bots}</b> computer {s.bots === 1 ? 'player' : 'players'}
              </li>
            )}
          </ul>
          <div className="mt-[2vh] flex gap-[1vw]">
            {players.map((p) => (
              <PlayerToken key={p.id} avatar={p.avatar} className="h-[7vh] w-[7vh]" />
            ))}
          </div>
        </div>
        <TrophySide view={view} />
      </div>
    );
  } else if (view.stage === 'intro') {
    body = (
      <div className="flex w-full flex-col gap-[3vh]">
        <Kicker>Minigame {view.round}</Kicker>
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
        <ReadyRow view={view} who={who} />
        <p className="text-[2.4vh] text-[var(--party-text-muted)]">
          1st gets 3 points · 2nd gets 2 · 3rd gets 1 · {view.settings.goal} for a trophy
        </p>
      </div>
    );
  } else if (view.stage === 'play') {
    body = (
      <div className="mx-auto flex w-[62vw] flex-col gap-[2vh]">
        <Kicker>
          Minigame {view.round} · {info.name}
        </Kicker>
        <Window color={info.color}>
          <PlayBody view={view} who={who} />
        </Window>
      </div>
    );
  } else {
    // results / over: the lanes are the focal point.
    const result = view.result;
    const trophyIds = result?.trophyIds ?? [];
    const changes: Record<string, number> = {};
    const details: Record<string, string> = {};
    for (const p of result?.placings ?? []) {
      changes[p.id] = trophyIds.includes(p.id) ? 0 : p.change;
      details[p.id] = trophyIds.includes(p.id) ? 'Trophy!' : p.detail;
    }
    const trophyNames = trophyIds.map((id) => who(id).name).join(' and ');
    const scores = (
      <div className="flex h-full w-full flex-col gap-[2vh]">
        <Kicker>
          {result ? `After ${MINI_INFO[result.mini].name} · minigame ${view.stage === 'over' ? view.round : view.round - 1}` : ''}
        </Kicker>
        {view.stage === 'over' ? (
          <div className="flex items-center gap-[1.6vw]">
            {view.winnerIds.map((id) => (
              <PlayerToken key={id} avatar={who(id).avatar} className="h-[10vh] w-[10vh]" />
            ))}
            <p className="font-[family-name:var(--font-display)] text-[8vh] leading-none font-bold text-[var(--home-gold)]">
              {view.winnerIds.map((id) => who(id).name).join(' and ')} {view.winnerIds.length > 1 ? 'win' : 'wins'} the night!
            </p>
          </div>
        ) : (
          trophyIds.length > 0 && (
            <p className="animate-home-fade font-[family-name:var(--font-display)] text-[5vh] leading-none font-bold text-[var(--home-gold)]">
              {trophyNames} {trophyIds.length > 1 ? 'win a trophy!' : 'wins a trophy!'}
            </p>
          )
        )}
        <div className="flex flex-1 items-center gap-[3vw]">
          <div className="flex-1">
            <Lanes view={view} who={who} changes={changes} details={details} />
          </div>
          <TrophySide view={view} />
        </div>
        {view.stage === 'results' && <UpNext view={view} who={who} />}
      </div>
    );
    body = result?.final ? (
      <FinalThenScores final={result.final} view={view} who={who}>
        {scores}
      </FinalThenScores>
    ) : (
      scores
    );
  }

  return (
    <div className="flex h-screen w-full items-center px-[6vw] py-[5vh] font-[family-name:var(--font-read)] text-[var(--party-text)] select-none">
      <PartyBackdrop />
      <div key={`${view.stage}-${view.round}`} className="animate-home-fade flex h-full w-full items-center">
        {body}
      </div>
    </div>
  );
}
