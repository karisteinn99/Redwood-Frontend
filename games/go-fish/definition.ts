import { defineGame } from '@shared/game';

export const STARTING_HAND = 5;
export const RANKS = 13; // 1-13; suits are irrelevant to gameplay, never modeled
export const COPIES_PER_RANK = 4;

export interface GoFishState {
  order: string[]; // fixed at init — nobody is ever removed, unlike Liar's Dice's elimination
  hands: Record<string, number[]>; // unbooked cards currently held, per player
  books: Record<string, number[]>; // completed ranks (sets of 4), public once formed
  stock: number[]; // face-down pile, index 0 = top
  currentPlayerId: string;
  lastEvent: GoFishEvent | null; // public commentary only — nothing here needs a group pause
}

export type GoFishAction = { type: 'ask'; targetId: string; rank: number };

export type GoFishEvent =
  | { type: 'transfer'; askerId: string; targetId: string; rank: number; count: number }
  | { type: 'fish-hit'; askerId: string; targetId: string; rank: number }
  | { type: 'fish-miss'; askerId: string; targetId: string; rank: number };

export interface GoFishPublicView {
  order: string[];
  handCounts: Record<string, number>;
  books: Record<string, number[]>;
  stockCount: number;
  currentPlayerId: string;
  lastEvent: GoFishEvent | null;
  winnerIds: string[] | null; // populated once finished; supports ties
}

export interface GoFishPlayerView extends GoFishPublicView {
  yourId: string;
  yourHand: number[];
}

// The only client-checkable illegal move: naming a rank you don't hold.
// There's no legal-move restriction on *who* to target — not knowing the
// target's hand is the entire point of the game.
export const distinctRanks = (hand: number[]): number[] => [...new Set(hand)].sort((a, b) => a - b);

function shuffled(deck: number[], random: () => number): number[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Extracts any completed 4-of-a-kind out of a hand into books. Run after
// every hand mutation (deal, transfer, draw) rather than only where a book
// "should" be possible, so there's no reliance on that invariant holding.
function settleBooks(hand: number[], books: number[]): { hand: number[]; books: number[] } {
  const counts = new Map<number, number>();
  for (const rank of hand) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const completed = [...counts.entries()].filter(([, n]) => n === COPIES_PER_RANK).map(([rank]) => rank);
  if (completed.length === 0) return { hand, books };
  const completedSet = new Set(completed);
  return { hand: hand.filter((rank) => !completedSet.has(rank)), books: [...books, ...completed] };
}

function isGameOver(state: GoFishState): boolean {
  return state.stock.length === 0 && state.order.every((id) => state.hands[id].length === 0);
}

function computeWinners(order: string[], books: Record<string, number[]>): string[] {
  const max = Math.max(...order.map((id) => books[id].length));
  return order.filter((id) => books[id].length === max);
}

// Runs before a player is allowed to act, whether they're continuing a "go
// again" or just received the turn. A player with an empty hand gets one
// free draw (no ask consumed) if the stock has cards; if the stock is also
// empty, they're skipped. Bounded loop (not a single step) so it correctly
// skips a *chain* of empty-handed players once the stock runs dry.
//
// Can't loop forever or leave anyone stuck: total remaining cards
// (stock + all hands) only ever decreases, so unless the game is actually
// over, at least one player in `order` holds a card — the skip branch is
// guaranteed to find them within one lap, and isGameOver is checked first
// on every iteration.
function resolveTurn(state: GoFishState): GoFishState {
  let s = state;
  for (let i = 0; i <= s.order.length; i++) {
    if (isGameOver(s)) return s;
    if (s.hands[s.currentPlayerId].length > 0) return s;
    if (s.stock.length > 0) {
      const [card, ...rest] = s.stock;
      const { hand, books } = settleBooks([...s.hands[s.currentPlayerId], card], s.books[s.currentPlayerId]);
      s = {
        ...s,
        stock: rest,
        hands: { ...s.hands, [s.currentPlayerId]: hand },
        books: { ...s.books, [s.currentPlayerId]: books },
      };
      continue;
    }
    const idx = s.order.indexOf(s.currentPlayerId);
    s = { ...s, currentPlayerId: s.order[(idx + 1) % s.order.length] };
  }
  return s; // unreachable given the invariant above; kept only as a defensive cap
}

function publicView(state: GoFishState): GoFishPublicView {
  const finished = isGameOver(state);
  return {
    order: state.order,
    handCounts: Object.fromEntries(state.order.map((id) => [id, state.hands[id].length])),
    books: state.books,
    stockCount: state.stock.length,
    currentPlayerId: state.currentPlayerId,
    lastEvent: state.lastEvent,
    winnerIds: finished ? computeWinners(state.order, state.books) : null,
  };
}

export const goFishGame = defineGame<GoFishState, GoFishAction, GoFishPublicView | GoFishPlayerView>({
  id: 'go-fish',
  name: 'Go Fish',
  minPlayers: 2,
  maxPlayers: 8,

  init(players, ctx) {
    const fullDeck: number[] = [];
    for (let rank = 1; rank <= RANKS; rank++) {
      for (let copy = 0; copy < COPIES_PER_RANK; copy++) fullDeck.push(rank);
    }
    const deck = shuffled(fullDeck, ctx.random);
    const order = players.map((p) => p.id);

    const hands: Record<string, number[]> = {};
    const books: Record<string, number[]> = {};
    let i = 0;
    for (const id of order) {
      const dealt = deck.slice(i, i + STARTING_HAND);
      i += STARTING_HAND;
      const settled = settleBooks(dealt, []);
      hands[id] = settled.hand;
      books[id] = settled.books;
    }

    return {
      order,
      hands,
      books,
      stock: deck.slice(i),
      currentPlayerId: order[0],
      lastEvent: null,
    };
  },

  reduce(state, action, playerId) {
    if (isGameOver(state)) return { error: 'The game is already over' };
    if (playerId !== state.currentPlayerId) return { error: 'Not your turn' };
    if (action.type !== 'ask') return { error: 'Unknown action' };

    const { targetId, rank } = action;
    if (targetId === playerId) return { error: 'Pick another player' };
    if (!state.order.includes(targetId)) return { error: 'Unknown player' };
    if (!Number.isInteger(rank) || rank < 1 || rank > RANKS) return { error: 'Rank must be between 1 and 13' };
    if (!state.hands[playerId].includes(rank)) return { error: 'You can only ask for a rank you hold' };

    const targetHand = state.hands[targetId];
    const matches = targetHand.filter((r) => r === rank);

    if (matches.length > 0) {
      const { hand, books } = settleBooks([...state.hands[playerId], ...matches], state.books[playerId]);
      const next: GoFishState = {
        ...state,
        hands: { ...state.hands, [playerId]: hand, [targetId]: targetHand.filter((r) => r !== rank) },
        books: { ...state.books, [playerId]: books },
        lastEvent: { type: 'transfer', askerId: playerId, targetId, rank, count: matches.length },
      };
      return { state: resolveTurn(next) };
    }

    const idx = state.order.indexOf(playerId);
    if (state.stock.length === 0) {
      const next: GoFishState = {
        ...state,
        currentPlayerId: state.order[(idx + 1) % state.order.length],
        lastEvent: { type: 'fish-miss', askerId: playerId, targetId, rank },
      };
      return { state: resolveTurn(next) };
    }

    const [drawn, ...restStock] = state.stock;
    const { hand, books } = settleBooks([...state.hands[playerId], drawn], state.books[playerId]);
    const hit = drawn === rank;
    const next: GoFishState = {
      ...state,
      stock: restStock,
      hands: { ...state.hands, [playerId]: hand },
      books: { ...state.books, [playerId]: books },
      currentPlayerId: hit ? playerId : state.order[(idx + 1) % state.order.length],
      lastEvent: { type: hit ? 'fish-hit' : 'fish-miss', askerId: playerId, targetId, rank },
    };
    return { state: resolveTurn(next) };
  },

  viewFor(state, viewer) {
    const base = publicView(state);
    if (viewer.kind === 'tv') return base;
    return { ...base, yourId: viewer.id, yourHand: state.hands[viewer.id] ?? [] };
  },

  isFinished(state) {
    return isGameOver(state);
  },
});
