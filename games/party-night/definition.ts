import { defineGame, type GameContext, type GamePlayer, type Viewer } from '@shared/game';

import { PICKS, VERSUS, type PickPrompt, type VersusQuestion } from './content';

// Party night: short minigames back to back. Each minigame ranks everyone:
// 1st +3 points, 2nd +2, 3rd +1. Past the sprint line (default 10 of 15) the
// last places lose points too, but never drop back below the line. Reaching
// the goal wins a trophy and resets that player to 0; first to the trophy
// count wins the night. The host sets this up before the first minigame, and
// can add bots for a test run.

export type MiniId = 'quick-tap' | 'versus' | 'same-pick' | 'closest';
// Same Pick is left out of the rotation (Kári, 2026-11-15); its code stays in case it comes back.
export const MINIS: MiniId[] = ['quick-tap', 'versus', 'closest'];
export const GAIN = [3, 2, 1];
export const TAPS = 3;
// A tap faster than any human, or a tap before the cue, costs this much.
export const FALSE_START_MS = 1000;
export const MIN_HUMAN_MS = 90;
const VERSUS_MAX = 8;
const PICK_ROUNDS = 3;
export const GUESS_ROUNDS = 2;
export const MAX_BOTS = 5;

export interface Settings {
  goal: number; // points for a trophy
  line: number; // the sprint starts past this
  trophies: number; // trophies to win the night
  sprint: boolean; // penalties past the line
  bots: number; // test mode: computer players
}
export const DEFAULT_SETTINGS: Settings = { goal: 15, line: 10, trophies: 2, sprint: true, bots: 0 };
export const GOAL_OPTIONS = [10, 15, 20, 25];
export const TROPHY_OPTIONS = [1, 2, 3];

// How many points the bottom places lose past the line, last place first.
export function sprintPenalties(players: number): number[] {
  if (players <= 3) return [1];
  if (players <= 5) return [2];
  return [2, 1];
}

interface QuickTap {
  kind: 'quick-tap';
  // How long each phone waits before showing the cue. Every phone times its
  // own tap against its own cue, so connection speed can't decide a winner.
  delays: number[];
  taps: Record<string, number[]>; // -1 is a false start
}

interface Versus {
  kind: 'versus';
  questions: number[];
  index: number;
  alive: string[];
  picks: Record<string, 'a' | 'b'>;
  outAt: Record<string, number>; // question index someone went out on
  reveal: { id: number; question: number; wrongIds: string[]; savedAll: boolean } | null;
}

interface SamePick {
  kind: 'same-pick';
  prompts: number[];
  index: number;
  picks: Record<string, number>;
  score: Record<string, number>;
  reveal: { id: number; prompt: number; counts: number[]; top: number[]; scorers: string[] } | null;
}

export interface DotField {
  dots: [number, number][]; // positions in 0..100
}

interface Closest {
  kind: 'closest';
  fields: DotField[];
  index: number;
  guesses: Record<string, number>;
  error: Record<string, number>; // total distance from the right answers
  reveal: { id: number; answer: number; guesses: Record<string, number> } | null;
}

type Mini = QuickTap | Versus | SamePick | Closest;

export interface Placing {
  id: string;
  place: number;
  change: number; // points this round, negative in the sprint
  detail: string;
}

export interface Bot {
  id: string;
  name: string;
}

export interface PartyState {
  order: string[]; // humans then bots
  bots: Bot[];
  settings: Settings;
  points: Record<string, number>;
  trophies: Record<string, number>;
  round: number;
  bag: MiniId[];
  // setup: the host picks settings. intro: before the first minigame. After
  // that, results doubles as the next minigame's intro (`mini` is the next).
  stage: 'setup' | 'intro' | 'play' | 'results' | 'over';
  mini: Mini;
  ready: string[];
  result: { mini: MiniId; placings: Placing[]; trophyIds: string[]; final: FinalReveal | null } | null;
  winnerIds: string[];
  // Players who left mid-game: nothing waits on them (optional for saved games).
  gone?: string[];
}

// The last question's answer, kept with the results so screens can show it
// before the scores (it never reaches the screens as a play view).
export type FinalReveal =
  | { kind: 'versus'; reveal: { id: number; question: VersusQuestion; wrongIds: string[]; savedAll: boolean } }
  | { kind: 'same-pick'; reveal: { id: number; prompt: PickPrompt; counts: number[]; top: number[]; scorers: string[] } }
  | { kind: 'closest'; reveal: { id: number; answer: number; guesses: Record<string, number> } };

function finalReveal(m: Mini): FinalReveal | null {
  if (m.kind === 'versus' && m.reveal) return { kind: 'versus', reveal: { ...m.reveal, question: VERSUS[m.reveal.question] } };
  if (m.kind === 'same-pick' && m.reveal) return { kind: 'same-pick', reveal: { ...m.reveal, prompt: PICKS[m.reveal.prompt] } };
  if (m.kind === 'closest' && m.reveal) return { kind: 'closest', reveal: m.reveal };
  return null;
}

export type PartyAction =
  | { type: 'settings'; settings: Partial<Settings> }
  | { type: 'begin' }
  | { type: 'ready' }
  | { type: 'go' }
  | { type: 'skip' }
  | { type: 'tap'; attempt: number; ms: number }
  | { type: 'pick'; choice: 'a' | 'b' }
  | { type: 'choose'; option: number }
  | { type: 'guess'; value: number };

type PublicQuestion = Omit<VersusQuestion, 'answer'>;

export type MiniView =
  | { kind: 'quick-tap'; delays: number[]; done: Record<string, number>; best: Record<string, number | null> }
  | {
      kind: 'versus';
      question: PublicQuestion | null;
      index: number;
      total: number;
      alive: string[];
      outAt: Record<string, number>;
      answered: string[];
      yourPick: 'a' | 'b' | null;
      reveal: { id: number; question: VersusQuestion; wrongIds: string[]; savedAll: boolean } | null;
    }
  | {
      kind: 'same-pick';
      prompt: PickPrompt | null;
      index: number;
      total: number;
      answered: string[];
      yourPick: number | null;
      score: Record<string, number>;
      reveal: { id: number; prompt: PickPrompt; counts: number[]; top: number[]; scorers: string[] } | null;
    }
  | {
      kind: 'closest';
      field: DotField | null;
      index: number;
      total: number;
      answered: string[];
      yourGuess: number | null;
      reveal: { id: number; answer: number; guesses: Record<string, number> } | null;
    };

export interface PartyView {
  yourId: string | null;
  order: string[];
  bots: Bot[];
  settings: Settings;
  points: Record<string, number>;
  trophies: Record<string, number>;
  round: number;
  stage: PartyState['stage'];
  ready: string[];
  miniId: MiniId;
  mini: MiniView;
  result: PartyState['result'];
  winnerIds: string[];
  gone: string[];
}

const isBot = (id: string) => id.startsWith('bot-');
const humans = (s: PartyState) => s.order.filter((id) => !isBot(id));
// Everyone still in the room: bots, and humans who haven't left.
const here = (s: PartyState) => s.order.filter((id) => !(s.gone ?? []).includes(id));
const humansHere = (s: PartyState) => here(s).filter((id) => !isBot(id));

function shuffle<T>(xs: T[], random: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dotField(random: () => number): DotField {
  const n = 25 + Math.floor(random() * 56); // 25..80
  const dots: [number, number][] = [];
  while (dots.length < n) {
    const p: [number, number] = [4 + random() * 92, 6 + random() * 88];
    if (dots.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) > 4.5)) dots.push(p);
  }
  return { dots };
}

function newMini(id: MiniId, order: string[], random: () => number): Mini {
  if (id === 'quick-tap') {
    return {
      kind: 'quick-tap',
      delays: Array.from({ length: TAPS }, () => 1500 + Math.floor(random() * 2500)),
      taps: Object.fromEntries(order.map((p) => [p, []])),
    };
  }
  if (id === 'versus') {
    return {
      kind: 'versus',
      questions: shuffle(VERSUS.map((_, i) => i), random).slice(0, VERSUS_MAX),
      index: 0,
      alive: [...order],
      picks: {},
      outAt: {},
      reveal: null,
    };
  }
  if (id === 'same-pick') {
    return {
      kind: 'same-pick',
      prompts: shuffle(PICKS.map((_, i) => i), random).slice(0, PICK_ROUNDS),
      index: 0,
      picks: {},
      score: Object.fromEntries(order.map((p) => [p, 0])),
      reveal: null,
    };
  }
  return {
    kind: 'closest',
    fields: Array.from({ length: GUESS_ROUNDS }, () => dotField(random)),
    index: 0,
    guesses: {},
    error: Object.fromEntries(order.map((p) => [p, 0])),
    reveal: null,
  };
}

// Sorted best-first by `key`; equal keys share a place (1, 1, 3).
// `earned` false means a place but no points (matched nothing, all false starts).
function rank(
  order: string[],
  key: (id: string) => number,
  detail: (id: string) => string,
  earned: (id: string) => boolean = () => true
): Placing[] {
  const sorted = [...order].sort((x, y) => key(x) - key(y));
  return sorted.map((id) => {
    const place = 1 + sorted.filter((o) => key(o) < key(id)).length;
    return { id, place, change: earned(id) ? (GAIN[place - 1] ?? 0) : 0, detail: detail(id) };
  });
}

export const tapCost = (ms: number) => (ms < MIN_HUMAN_MS || ms > FALSE_START_MS ? FALSE_START_MS : ms);
const bestTap = (taps: number[]) => {
  const ok = taps.filter((t) => tapCost(t) < FALSE_START_MS);
  return ok.length ? Math.min(...ok) : null;
};

function placings(mini: Mini, order: string[]): Placing[] {
  if (mini.kind === 'quick-tap') {
    const total = (id: string) => mini.taps[id].reduce((s, t) => s + tapCost(t), 0);
    return rank(
      order,
      total,
      (id) => {
        // Placed on all three tries, so say that, not just the best one.
        const ok = mini.taps[id].filter((t) => tapCost(t) < FALSE_START_MS);
        const misses = mini.taps[id].length - ok.length;
        if (!ok.length) return 'All too early or slow';
        const avg = `Average ${(ok.reduce((a, b) => a + b, 0) / ok.length / 1000).toFixed(3)} s`;
        return misses ? `${avg} · ${misses} missed` : avg;
      },
      (id) => bestTap(mini.taps[id]) !== null
    );
  }
  if (mini.kind === 'versus') {
    // Still standing beats out late, which beats out early.
    const survived = (id: string) => (mini.alive.includes(id) ? -1000 : -mini.outAt[id]);
    return rank(order, survived, (id) =>
      mini.alive.includes(id) ? 'Won it' : `Out on question ${mini.outAt[id] + 1}`
    );
  }
  if (mini.kind === 'same-pick') {
    return rank(
      order,
      (id) => -mini.score[id],
      (id) => `Matched ${mini.score[id]} of ${mini.prompts.length}`,
      (id) => mini.score[id] > 0
    );
  }
  return rank(
    order,
    (id) => mini.error[id],
    (id) => (mini.error[id] === 0 ? 'Spot on' : `Off by ${mini.error[id]} in total`)
  );
}

function miniDone(mini: Mini, order: string[]): boolean {
  if (mini.kind === 'quick-tap') return order.every((id) => mini.taps[id].length >= TAPS);
  if (mini.kind === 'versus') return mini.alive.length <= 1 || mini.index >= mini.questions.length;
  if (mini.kind === 'same-pick') return mini.index >= mini.prompts.length;
  return mini.index >= mini.fields.length;
}

// Every remaining answer is in (or the host stopped waiting): settle it.
function resolveVersus(m: Versus): Versus {
  const answer = VERSUS[m.questions[m.index]].answer;
  const wrongIds = m.alive.filter((id) => m.picks[id] !== answer);
  const savedAll = wrongIds.length === m.alive.length;
  const outAt = { ...m.outAt };
  if (!savedAll) for (const id of wrongIds) outAt[id] = m.index;
  return {
    ...m,
    alive: savedAll ? m.alive : m.alive.filter((id) => !wrongIds.includes(id)),
    outAt,
    picks: {},
    index: m.index + 1,
    reveal: { id: m.index + 1, question: m.questions[m.index], wrongIds, savedAll },
  };
}

function resolvePick(m: SamePick, order: string[]): SamePick {
  const counts = [0, 0, 0, 0];
  for (const id of order) if (m.picks[id] !== undefined) counts[m.picks[id]]++;
  const max = Math.max(...counts);
  // A lone pick isn't a crowd: nobody scores if everyone picked differently.
  const top = max >= 2 ? counts.flatMap((c, i) => (c === max ? [i] : [])) : [];
  const scorers = order.filter((id) => m.picks[id] !== undefined && top.includes(m.picks[id]));
  const score = { ...m.score };
  for (const id of scorers) score[id]++;
  return {
    ...m,
    score,
    picks: {},
    index: m.index + 1,
    reveal: { id: m.index + 1, prompt: m.prompts[m.index], counts, top, scorers },
  };
}

function resolveClosest(m: Closest, order: string[]): Closest {
  const answer = m.fields[m.index].dots.length;
  const error = { ...m.error };
  // No guess counts as a wild miss.
  for (const id of order) error[id] += m.guesses[id] !== undefined ? Math.abs(m.guesses[id] - answer) : answer;
  return {
    ...m,
    error,
    guesses: {},
    index: m.index + 1,
    reveal: { id: m.index + 1, answer, guesses: m.guesses },
  };
}

function scoreRound(state: PartyState, list: Placing[]): PartyState {
  const { goal, line, sprint, trophies: needed } = state.settings;
  const points = { ...state.points };
  const trophies = { ...state.trophies };
  const lastPlace = Math.max(...list.map((p) => p.place));
  const places = [...new Set(list.map((p) => p.place))].sort((a, b) => b - a); // worst first
  const penalties = sprintPenalties(state.order.length);
  const scored = list.map((p) => {
    const before = points[p.id];
    let change = p.change;
    // In the sprint, the bottom places lose points (not when everyone tied).
    if (sprint && before >= line && change === 0 && lastPlace > 1) {
      const fromBottom = places.indexOf(p.place);
      if (fromBottom >= 0 && fromBottom < penalties.length) change = -penalties[fromBottom];
    }
    let after = before + change;
    if (before >= line) after = Math.max(line, after); // never back out of the sprint
    points[p.id] = after;
    return { ...p, change: after - before };
  });
  const trophyIds = state.order.filter((id) => points[id] >= goal);
  for (const id of trophyIds) {
    trophies[id] += 1;
    points[id] = 0;
  }
  const winnerIds = state.order.filter((id) => trophies[id] >= needed);
  return {
    ...state,
    points,
    trophies,
    stage: winnerIds.length ? 'over' : 'results',
    result: { mini: state.mini.kind, placings: scored, trophyIds, final: finalReveal(state.mini) },
    winnerIds,
  };
}

function finishIfDone(state: PartyState, random: () => number): PartyState {
  if (state.stage !== 'play' || !miniDone(state.mini, state.order)) return state;
  const done = scoreRound(state, placings(state.mini, state.order));
  return done.stage === 'over' ? done : nextMini(done, random);
}

function nextMini(state: PartyState, random: () => number): PartyState {
  let bag = state.bag;
  if (bag.length === 0) {
    bag = shuffle(MINIS, random);
    if (bag[0] === state.mini.kind) bag.push(bag.shift()!);
  }
  const [id, ...rest] = bag;
  return { ...state, bag: rest, round: state.round + 1, ready: [], mini: newMini(id, state.order, random) };
}

// Bots answer the moment there's something to answer, then the step settles
// if they were the last ones it waited for. Loops because one settled step
// (a Knockout question) can open the next.
function botsPlay(state: PartyState, random: () => number): PartyState {
  let s = state;
  for (let guard = 0; guard < 50 && s.stage === 'play'; guard++) {
    if (humansHere(s).length === 0) return s;
    const bots = s.bots.map((b) => b.id);
    const away = s.gone ?? [];
    const m = s.mini;
    let next: Mini = m;
    if (m.kind === 'quick-tap') {
      const taps = { ...m.taps };
      for (const id of bots) {
        if (taps[id].length < TAPS) {
          taps[id] = Array.from({ length: TAPS }, () => (random() < 0.1 ? -1 : 200 + Math.floor(random() * 260)));
        }
      }
      // Someone who left misses their remaining taps.
      for (const id of away) if (taps[id] && taps[id].length < TAPS) taps[id] = [...taps[id], ...Array(TAPS - taps[id].length).fill(-1)];
      next = { ...m, taps };
    } else if (m.kind === 'versus' && m.index < m.questions.length) {
      const picks = { ...m.picks };
      const answer = VERSUS[m.questions[m.index]].answer;
      for (const id of bots) {
        if (m.alive.includes(id) && !picks[id]) picks[id] = random() < 0.65 ? answer : answer === 'a' ? 'b' : 'a';
      }
      next = { ...m, picks };
      if (next.alive.every((id) => (next as Versus).picks[id] || away.includes(id))) next = resolveVersus(next as Versus);
    } else if (m.kind === 'same-pick' && m.index < m.prompts.length) {
      const picks = { ...m.picks };
      for (const id of bots) if (picks[id] === undefined) picks[id] = Math.floor(random() * 4);
      next = { ...m, picks };
      if (here(s).every((id) => (next as SamePick).picks[id] !== undefined)) next = resolvePick(next as SamePick, s.order);
    } else if (m.kind === 'closest' && m.index < m.fields.length) {
      const guesses = { ...m.guesses };
      const answer = m.fields[m.index].dots.length;
      for (const id of bots) {
        if (guesses[id] === undefined) guesses[id] = Math.max(1, answer + Math.round((random() - 0.5) * answer * 0.6));
      }
      next = { ...m, guesses };
      if (here(s).every((id) => (next as Closest).guesses[id] !== undefined)) next = resolveClosest(next as Closest, s.order);
    }
    const after = finishIfDone({ ...s, mini: next }, random);
    if (JSON.stringify(after) === JSON.stringify(s)) return s;
    s = after;
  }
  return s;
}

const BOT_NAMES = ['Robo Ragnar', 'Robo Sól', 'Robo Bjarki', 'Robo Una', 'Robo Tumi'];

export const partyNightGame = defineGame<PartyState, PartyAction, PartyView>({
  id: 'party-night',
  name: 'The Pickle',
  // One is enough when testing with bots; the setup screen says so.
  minPlayers: 1,
  maxPlayers: 8,

  init(players: GamePlayer[], ctx: GameContext): PartyState {
    const order = players.map((p) => p.id);
    const [first, ...bag] = shuffle(MINIS, ctx.random);
    // Alone? Start with a few bots suggested so a solo test just works.
    const settings = { ...DEFAULT_SETTINGS, bots: order.length === 1 ? 3 : 0 };
    return {
      order,
      bots: [],
      settings,
      points: Object.fromEntries(order.map((id) => [id, 0])),
      trophies: Object.fromEntries(order.map((id) => [id, 0])),
      round: 1,
      bag,
      stage: 'setup',
      mini: newMini(first, order, ctx.random),
      ready: [],
      result: null,
      winnerIds: [],
    };
  },

  reduce(state, action, playerId, ctx) {
    if (!state.order.includes(playerId)) return { error: 'You’re not in this party.' };
    const isHost = ctx.hostId === playerId;

    if (action.type === 'settings') {
      if (!isHost) return { error: 'Only the host can change the setup.' };
      if (state.stage !== 'setup') return { error: 'The night has already started.' };
      const s = { ...state.settings, ...action.settings };
      const goal = GOAL_OPTIONS.includes(s.goal) ? s.goal : state.settings.goal;
      const settings: Settings = {
        goal,
        line: Math.max(1, Math.min(goal - 1, Math.round(s.line))),
        trophies: TROPHY_OPTIONS.includes(s.trophies) ? s.trophies : state.settings.trophies,
        sprint: !!s.sprint,
        bots: Math.max(0, Math.min(MAX_BOTS, Math.round(s.bots))),
      };
      // Changing the goal moves the line with it, keeping the sprint 5 long.
      if (action.settings.goal !== undefined && action.settings.line === undefined) {
        settings.line = Math.max(1, goal - 5);
      }
      return { state: { ...state, settings } };
    }

    if (action.type === 'begin') {
      if (!isHost) return { error: 'Only the host can start the night.' };
      if (state.stage !== 'setup') return { error: 'The night has already started.' };
      if (state.order.length + state.settings.bots < 2) return { error: 'Add a bot or a player to start.' };
      const bots = BOT_NAMES.slice(0, state.settings.bots).map((name, i) => ({ id: `bot-${i + 1}`, name }));
      const order = [...state.order, ...bots.map((b) => b.id)];
      return {
        state: {
          ...state,
          bots,
          order,
          points: Object.fromEntries(order.map((id) => [id, 0])),
          trophies: Object.fromEntries(order.map((id) => [id, 0])),
          mini: newMini(state.mini.kind, order, ctx.random),
          stage: 'intro',
        },
      };
    }

    const waiting = state.stage === 'intro' || state.stage === 'results';
    if (action.type === 'ready') {
      if (!waiting) return { error: 'Nothing to get ready for.' };
      if (state.ready.includes(playerId)) return { state };
      const ready = [...state.ready, playerId];
      const all = humansHere(state).every((id) => ready.includes(id));
      return { state: all ? botsPlay({ ...state, stage: 'play', ready: [] }, ctx.random) : { ...state, ready } };
    }
    if (action.type === 'go') {
      if (!isHost) return { error: 'Only the host can start without everyone.' };
      if (!waiting) return { error: 'Already playing.' };
      return { state: botsPlay({ ...state, stage: 'play', ready: [] }, ctx.random) };
    }
    if (state.stage !== 'play') return { error: 'Wait for the minigame to start.' };

    const m = state.mini;
    let next: Mini;
    if (action.type === 'skip') {
      if (!isHost) return { error: 'Only the host can stop waiting.' };
      if (m.kind === 'quick-tap') {
        next = {
          ...m,
          taps: Object.fromEntries(
            state.order.map((id) => [id, [...m.taps[id], ...Array(TAPS - m.taps[id].length).fill(-1)]])
          ),
        };
      } else if (m.kind === 'versus') next = resolveVersus(m);
      else if (m.kind === 'same-pick') next = resolvePick(m, state.order);
      else next = resolveClosest(m, state.order);
    } else if (action.type === 'tap') {
      if (m.kind !== 'quick-tap') return { error: 'Not a tapping game.' };
      const mine = m.taps[playerId];
      if (mine.length >= TAPS) return { error: 'You’ve had all your taps.' };
      if (action.attempt !== mine.length) return { error: 'That tap is out of order.' };
      const ms = Number.isFinite(action.ms) ? Math.round(action.ms) : -1;
      next = { ...m, taps: { ...m.taps, [playerId]: [...mine, ms] } };
    } else if (action.type === 'pick') {
      if (m.kind !== 'versus') return { error: 'Not a this-or-that game.' };
      if (!m.alive.includes(playerId)) return { error: 'You’re out of this one.' };
      if (m.picks[playerId]) return { error: 'You’ve already answered.' };
      if (action.choice !== 'a' && action.choice !== 'b') return { error: 'Pick one of the two.' };
      const v: Versus = { ...m, picks: { ...m.picks, [playerId]: action.choice } };
      next = v.alive.every((id) => v.picks[id] || (state.gone ?? []).includes(id)) ? resolveVersus(v) : v;
    } else if (action.type === 'choose') {
      if (m.kind !== 'same-pick') return { error: 'Not a picking game.' };
      if (m.picks[playerId] !== undefined) return { error: 'You’ve already picked.' };
      if (![0, 1, 2, 3].includes(action.option)) return { error: 'Pick one of the four.' };
      const p: SamePick = { ...m, picks: { ...m.picks, [playerId]: action.option } };
      next = here(state).every((id) => p.picks[id] !== undefined) ? resolvePick(p, state.order) : p;
    } else if (action.type === 'guess') {
      if (m.kind !== 'closest') return { error: 'Not a guessing game.' };
      if (m.guesses[playerId] !== undefined) return { error: 'You’ve already guessed.' };
      const value = Math.round(action.value);
      if (!Number.isFinite(value) || value < 0 || value > 999) return { error: 'Guess a number from 0 to 999.' };
      const c: Closest = { ...m, guesses: { ...m.guesses, [playerId]: value } };
      next = here(state).every((id) => c.guesses[id] !== undefined) ? resolveClosest(c, state.order) : c;
    } else {
      return { error: 'Unknown move.' };
    }
    return { state: botsPlay(finishIfDone({ ...state, mini: next }, ctx.random), ctx.random) };
  },

  viewFor(state, viewer: Viewer): PartyView {
    const you = viewer.kind === 'player' ? viewer.id : null;
    const m = state.mini;
    let mini: MiniView;
    if (m.kind === 'quick-tap') {
      mini = {
        kind: 'quick-tap',
        delays: m.delays,
        done: Object.fromEntries(state.order.map((id) => [id, m.taps[id]?.length ?? 0])),
        best: Object.fromEntries(state.order.map((id) => [id, bestTap(m.taps[id] ?? [])])),
      };
    } else if (m.kind === 'versus') {
      const q = m.index < m.questions.length ? VERSUS[m.questions[m.index]] : null;
      mini = {
        kind: 'versus',
        // The answer stays on the server until everyone has picked.
        question: q && { prompt: q.prompt, a: q.a, b: q.b },
        index: m.index,
        total: m.questions.length,
        alive: m.alive,
        outAt: m.outAt,
        answered: Object.keys(m.picks),
        yourPick: (you && m.picks[you]) || null,
        reveal: m.reveal && { ...m.reveal, question: VERSUS[m.reveal.question] },
      };
    } else if (m.kind === 'same-pick') {
      mini = {
        kind: 'same-pick',
        prompt: m.index < m.prompts.length ? PICKS[m.prompts[m.index]] : null,
        index: m.index,
        total: m.prompts.length,
        // Who picked what stays hidden until everyone has, so nobody copies.
        answered: Object.keys(m.picks),
        yourPick: you && m.picks[you] !== undefined ? m.picks[you] : null,
        score: m.score,
        reveal: m.reveal && { ...m.reveal, prompt: PICKS[m.reveal.prompt] },
      };
    } else {
      mini = {
        kind: 'closest',
        // Phones never get the dots: you have to look at the TV.
        field: viewer.kind === 'tv' && m.index < m.fields.length ? m.fields[m.index] : null,
        index: m.index,
        total: m.fields.length,
        answered: Object.keys(m.guesses),
        yourGuess: you && m.guesses[you] !== undefined ? m.guesses[you] : null,
        reveal: m.reveal,
      };
    }
    return {
      yourId: you,
      order: state.order,
      bots: state.bots,
      settings: state.settings,
      points: state.points,
      trophies: state.trophies,
      round: state.round,
      stage: state.stage,
      ready: state.ready,
      miniId: m.kind,
      mini,
      result: state.result,
      winnerIds: state.winnerIds,
      gone: state.gone ?? [],
    };
  },

  presence(state, present) {
    const gone = humans(state).filter((id) => !present.includes(id));
    let s: PartyState = { ...state, gone, ready: state.ready.filter((id) => !gone.includes(id)) };
    // Everyone still here is ready: go.
    const waiting = s.stage === 'intro' || s.stage === 'results';
    const left = humansHere(s);
    if (waiting && left.length > 0 && left.every((id) => s.ready.includes(id))) s = { ...s, stage: 'play', ready: [] };
    return botsPlay(s, Math.random);
  },

  isFinished: (state) => state.stage === 'over',
});
