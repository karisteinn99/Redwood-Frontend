import { defineGame, type GameContext, type GamePlayer, type Viewer } from '@shared/game';

import { PICKS, VERSUS, type PickPrompt, type VersusQuestion } from './content';

// Party night: short minigames back to back. Each one ranks the players, and
// the ranking climbs them up a 12-step tower (1st 3 steps, 2nd 2, 3rd 1).
// First to the top wins. Everyone readies up on their phone before each
// minigame (the results screen already shows the next one); the host can
// start without stragglers, or stop waiting for someone mid-game.

export type MiniId = 'quick-tap' | 'versus' | 'same-pick';
export const MINIS: MiniId[] = ['quick-tap', 'versus', 'same-pick'];
export const GOAL = 12;
export const STEP_GAIN = [3, 2, 1];
export const TAPS = 3;
// A tap faster than any human, or a tap before the cue, costs this much.
export const FALSE_START_MS = 1000;
export const MIN_HUMAN_MS = 90;
const VERSUS_MAX = 8;
const PICK_ROUNDS = 3;

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

type Mini = QuickTap | Versus | SamePick;

export interface Placing {
  id: string;
  place: number;
  gain: number;
  detail: string;
}

export interface PartyState {
  order: string[];
  steps: Record<string, number>;
  round: number;
  bag: MiniId[];
  // intro is only before the first minigame; after that, results doubles as
  // the next minigame's intro and `mini` already holds the next one.
  stage: 'intro' | 'play' | 'results' | 'over';
  mini: Mini;
  ready: string[];
  result: { mini: MiniId; placings: Placing[] } | null;
  winnerIds: string[];
}

export type PartyAction =
  | { type: 'ready' }
  | { type: 'go' }
  | { type: 'skip' }
  | { type: 'tap'; attempt: number; ms: number }
  | { type: 'pick'; choice: 'a' | 'b' }
  | { type: 'choose'; option: number };

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
    };

export interface PartyView {
  yourId: string | null;
  order: string[];
  steps: Record<string, number>;
  goal: number;
  round: number;
  stage: PartyState['stage'];
  ready: string[];
  miniId: MiniId;
  mini: MiniView;
  result: PartyState['result'];
  winnerIds: string[];
}

function shuffle<T>(xs: T[], random: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  return {
    kind: 'same-pick',
    prompts: shuffle(PICKS.map((_, i) => i), random).slice(0, PICK_ROUNDS),
    index: 0,
    picks: {},
    score: Object.fromEntries(order.map((p) => [p, 0])),
    reveal: null,
  };
}

// Sorted best-first by `key`; equal keys share a place (1, 1, 3).
// `earned` false means a place but no steps (matched nothing, all false starts).
function rank(
  order: string[],
  key: (id: string) => number,
  detail: (id: string) => string,
  earned: (id: string) => boolean = () => true
): Placing[] {
  const sorted = [...order].sort((x, y) => key(x) - key(y));
  return sorted.map((id) => {
    const place = 1 + sorted.filter((o) => key(o) < key(id)).length;
    return { id, place, gain: earned(id) ? (STEP_GAIN[place - 1] ?? 0) : 0, detail: detail(id) };
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
    return rank(order, total, (id) => {
      const best = bestTap(mini.taps[id]);
      return best === null ? 'All false starts' : `Best ${(best / 1000).toFixed(3)} s`;
    }, (id) => bestTap(mini.taps[id]) !== null);
  }
  if (mini.kind === 'versus') {
    // Still standing beats out late, which beats out early.
    const survived = (id: string) => (mini.alive.includes(id) ? -1000 : -mini.outAt[id]);
    return rank(order, survived, (id) =>
      mini.alive.includes(id) ? 'Won it' : `Knocked out on question ${mini.outAt[id] + 1}`
    );
  }
  return rank(
    order,
    (id) => -mini.score[id],
    (id) => `Matched ${mini.score[id]} of ${mini.prompts.length}`,
    (id) => mini.score[id] > 0
  );
}

function miniDone(mini: Mini, order: string[]): boolean {
  if (mini.kind === 'quick-tap') return order.every((id) => mini.taps[id].length >= TAPS);
  if (mini.kind === 'versus') return mini.alive.length <= 1 || mini.index >= mini.questions.length;
  return mini.index >= mini.prompts.length;
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

function finishIfDone(state: PartyState, random: () => number): PartyState {
  if (!miniDone(state.mini, state.order)) return state;
  const list = placings(state.mini, state.order);
  const steps = { ...state.steps };
  for (const p of list) steps[p.id] = Math.min(GOAL, steps[p.id] + p.gain);
  const top = Math.max(...state.order.map((id) => steps[id]));
  const over = top >= GOAL;
  const done: PartyState = {
    ...state,
    steps,
    stage: over ? 'over' : 'results',
    result: { mini: state.mini.kind, placings: list },
    winnerIds: over ? state.order.filter((id) => steps[id] === top) : [],
  };
  return over ? done : nextMini(done, random);
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

export const partyNightGame = defineGame<PartyState, PartyAction, PartyView>({
  id: 'party-night',
  name: 'Party night',
  minPlayers: 2,
  maxPlayers: 8,

  init(players: GamePlayer[], ctx: GameContext): PartyState {
    const order = players.map((p) => p.id);
    const [first, ...bag] = shuffle(MINIS, ctx.random);
    return {
      order,
      steps: Object.fromEntries(order.map((id) => [id, 0])),
      round: 1,
      bag,
      stage: 'intro',
      mini: newMini(first, order, ctx.random),
      ready: [],
      result: null,
      winnerIds: [],
    };
  },

  reduce(state, action, playerId, ctx) {
    if (!state.order.includes(playerId)) return { error: 'You’re not in this party.' };
    const isHost = ctx.hostId === playerId;

    const waiting = state.stage === 'intro' || state.stage === 'results';
    if (action.type === 'ready') {
      if (!waiting) return { error: 'Nothing to get ready for.' };
      if (state.ready.includes(playerId)) return { state };
      const ready = [...state.ready, playerId];
      const all = state.order.every((id) => ready.includes(id));
      return { state: all ? { ...state, stage: 'play', ready: [] } : { ...state, ready } };
    }
    if (action.type === 'go') {
      if (!isHost) return { error: 'Only the host can start without everyone.' };
      if (!waiting) return { error: 'Already playing.' };
      return { state: { ...state, stage: 'play', ready: [] } };
    }
    if (state.stage !== 'play') return { error: 'Wait for the minigame to start.' };

    const m = state.mini;
    if (action.type === 'skip') {
      if (!isHost) return { error: 'Only the host can stop waiting.' };
      if (m.kind === 'quick-tap') {
        const taps = Object.fromEntries(
          state.order.map((id) => [id, [...m.taps[id], ...Array(TAPS - m.taps[id].length).fill(-1)]])
        );
        return { state: finishIfDone({ ...state, mini: { ...m, taps } }, ctx.random) };
      }
      if (m.kind === 'versus') return { state: finishIfDone({ ...state, mini: resolveVersus(m) }, ctx.random) };
      return { state: finishIfDone({ ...state, mini: resolvePick(m, state.order) }, ctx.random) };
    }

    if (action.type === 'tap') {
      if (m.kind !== 'quick-tap') return { error: 'Not a tapping game.' };
      const mine = m.taps[playerId];
      if (mine.length >= TAPS) return { error: 'You’ve had all your taps.' };
      if (action.attempt !== mine.length) return { error: 'That tap is out of order.' };
      const ms = Number.isFinite(action.ms) ? Math.round(action.ms) : -1;
      const taps = { ...m.taps, [playerId]: [...mine, ms] };
      return { state: finishIfDone({ ...state, mini: { ...m, taps } }, ctx.random) };
    }

    if (action.type === 'pick') {
      if (m.kind !== 'versus') return { error: 'Not a this-or-that game.' };
      if (!m.alive.includes(playerId)) return { error: 'You’re out of this one.' };
      if (m.picks[playerId]) return { error: 'You’ve already answered.' };
      if (action.choice !== 'a' && action.choice !== 'b') return { error: 'Pick one of the two.' };
      let next: Versus = { ...m, picks: { ...m.picks, [playerId]: action.choice } };
      if (next.alive.every((id) => next.picks[id])) next = resolveVersus(next);
      return { state: finishIfDone({ ...state, mini: next }, ctx.random) };
    }

    if (action.type === 'choose') {
      if (m.kind !== 'same-pick') return { error: 'Not a picking game.' };
      if (m.picks[playerId] !== undefined) return { error: 'You’ve already picked.' };
      if (![0, 1, 2, 3].includes(action.option)) return { error: 'Pick one of the four.' };
      let next: SamePick = { ...m, picks: { ...m.picks, [playerId]: action.option } };
      if (state.order.every((id) => next.picks[id] !== undefined)) next = resolvePick(next, state.order);
      return { state: finishIfDone({ ...state, mini: next }, ctx.random) };
    }

    return { error: 'Unknown move.' };
  },

  viewFor(state, viewer: Viewer): PartyView {
    const you = viewer.kind === 'player' ? viewer.id : null;
    const m = state.mini;
    let mini: MiniView;
    if (m.kind === 'quick-tap') {
      mini = {
        kind: 'quick-tap',
        delays: m.delays,
        done: Object.fromEntries(state.order.map((id) => [id, m.taps[id].length])),
        best: Object.fromEntries(state.order.map((id) => [id, bestTap(m.taps[id])])),
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
    } else {
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
    }
    return {
      yourId: you,
      order: state.order,
      steps: state.steps,
      goal: GOAL,
      round: state.round,
      stage: state.stage,
      ready: state.ready,
      miniId: m.kind,
      mini,
      result: state.result,
      winnerIds: state.winnerIds,
    };
  },

  isFinished: (state) => state.stage === 'over',
});
