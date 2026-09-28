import { defineGame } from '@shared/game';
import type { GameContext } from '@shared/game';

export const STARTING_DICE = 5;

export interface Bid {
  quantity: number;
  face: number; // 1-6
}

export interface Reveal {
  id: string; // lets a client detect "this is a fresh reveal" to (re)start its own reveal animation
  challengerId: string;
  bidderId: string;
  bid: Bid;
  actualCount: number;
  loserId: string;
  allDice: Record<string, number[]>;
}

export interface LiarsDiceState {
  order: string[]; // alive players, turn order
  dice: Record<string, number[]>; // every player who ever joined; [] once eliminated
  currentPlayerId: string;
  currentBid: Bid | null;
  bidHistory: (Bid & { playerId: string })[]; // this round only
  lastReveal: Reveal | null; // kept on screen until every player (or the host) continues
  revealAcks: string[]; // player ids who've pressed "continue" on the current lastReveal
  winnerId: string | null;
}

export type LiarsDiceAction =
  | { type: 'bid'; quantity: number; face: number }
  | { type: 'challenge' }
  | { type: 'continue' };

export interface LiarsDicePublicView {
  diceCounts: Record<string, number>;
  order: string[];
  currentPlayerId: string;
  currentBid: Bid | null;
  bidHistory: (Bid & { playerId: string })[];
  lastReveal: Reveal | null;
  revealAcks: string[];
  winnerId: string | null;
}

export interface LiarsDicePlayerView extends LiarsDicePublicView {
  yourId: string;
  yourDice: number[];
}

const roll = (n: number, ctx: GameContext) =>
  Array.from({ length: n }, () => 1 + Math.floor(ctx.random() * 6));

// 1s are wild and out-bid every other face at the same quantity.
// Exported so the phone UI can disable illegal bids instead of round-tripping an error.
export const faceRank = (face: number) => (face === 1 ? 6 : face - 1);

export const isHigherBid = (next: Bid, current: Bid) =>
  next.quantity > current.quantity ||
  (next.quantity === current.quantity && faceRank(next.face) > faceRank(current.face));

export const isLegalBid = (next: Bid, current: Bid | null) =>
  current === null || isHigherBid(next, current);

// The cheapest legal quantity for a given face, given the current bid — used
// by the phone UI to snap the quantity down when you switch faces, instead
// of disabling faces that would otherwise be a perfectly fine bid.
export const minimumLegalQuantity = (face: number, current: Bid | null) => {
  if (!current) return 1;
  return isLegalBid({ quantity: current.quantity, face }, current) ? current.quantity : current.quantity + 1;
};

function publicView(state: LiarsDiceState): LiarsDicePublicView {
  return {
    diceCounts: Object.fromEntries(Object.entries(state.dice).map(([id, d]) => [id, d.length])),
    order: state.order,
    currentPlayerId: state.currentPlayerId,
    currentBid: state.currentBid,
    bidHistory: state.bidHistory,
    lastReveal: state.lastReveal,
    revealAcks: state.revealAcks,
    winnerId: state.winnerId,
  };
}

export const liarsDiceGame = defineGame<LiarsDiceState, LiarsDiceAction, LiarsDicePublicView | LiarsDicePlayerView>({
  id: 'liars-dice',
  name: "Liar's Dice",
  minPlayers: 2,
  maxPlayers: 8,

  init(players, ctx) {
    const order = players.map((p) => p.id);
    const dice: Record<string, number[]> = {};
    for (const id of order) dice[id] = roll(STARTING_DICE, ctx);
    return {
      order,
      dice,
      currentPlayerId: order[0],
      currentBid: null,
      bidHistory: [],
      lastReveal: null,
      revealAcks: [],
      winnerId: null,
    };
  },

  reduce(state, action, playerId, ctx) {
    // Acknowledging a reveal isn't turn-based — anyone can send it any time
    // there's a pending reveal, and the host can force everyone past it.
    if (action.type === 'continue') {
      if (!state.lastReveal) return { error: 'Nothing to continue from' };
      if (playerId === ctx.hostId) {
        return { state: { ...state, lastReveal: null, revealAcks: [] } };
      }
      const revealAcks = state.revealAcks.includes(playerId)
        ? state.revealAcks
        : [...state.revealAcks, playerId];
      const everyoneAcked = state.order.length > 0 && state.order.every((id) => revealAcks.includes(id));
      return {
        state: everyoneAcked
          ? { ...state, lastReveal: null, revealAcks: [] }
          : { ...state, revealAcks },
      };
    }

    if (state.winnerId) return { error: 'The game is already over' };
    if (state.lastReveal) return { error: 'Waiting for everyone to continue past the last reveal' };
    if (playerId !== state.currentPlayerId) return { error: 'Not your turn' };

    if (action.type === 'bid') {
      const bid = { quantity: action.quantity, face: action.face };
      if (!Number.isInteger(bid.quantity) || bid.quantity < 1)
        return { error: 'Quantity must be a positive whole number' };
      if (!Number.isInteger(bid.face) || bid.face < 1 || bid.face > 6)
        return { error: 'Face must be between 1 and 6' };
      if (!isLegalBid(bid, state.currentBid))
        return { error: 'Your bid must raise the current one' };

      const idx = state.order.indexOf(playerId);
      const nextPlayerId = state.order[(idx + 1) % state.order.length];
      return {
        state: {
          ...state,
          currentBid: bid,
          bidHistory: [...state.bidHistory, { ...bid, playerId }],
          currentPlayerId: nextPlayerId,
        },
      };
    }

    if (action.type === 'challenge') {
      if (!state.currentBid) return { error: 'No bid to challenge yet' };
      const bid = state.currentBid;
      const bidderId = state.bidHistory[state.bidHistory.length - 1]?.playerId;
      if (!bidderId) return { error: 'No bid to challenge yet' };

      let actualCount = 0;
      for (const id of state.order) {
        for (const die of state.dice[id]) {
          if (die === bid.face || (bid.face !== 1 && die === 1)) actualCount++;
        }
      }
      const bidWasTrue = actualCount >= bid.quantity;
      const loserId = bidWasTrue ? playerId : bidderId;

      const dice: Record<string, number[]> = { ...state.dice };
      const allDice = Object.fromEntries(state.order.map((id) => [id, dice[id]]));
      dice[loserId] = dice[loserId].slice(1);

      const eliminated = dice[loserId].length === 0;
      const order = eliminated ? state.order.filter((id) => id !== loserId) : state.order;

      const lastReveal: Reveal = {
        id: `${ctx.random()}`,
        challengerId: playerId,
        bidderId,
        bid,
        actualCount,
        loserId,
        allDice,
      };

      if (order.length === 1) {
        return {
          state: {
            ...state,
            dice,
            order,
            currentBid: null,
            lastReveal,
            revealAcks: [],
            winnerId: order[0],
          },
        };
      }

      for (const id of order) dice[id] = roll(dice[id].length, ctx);
      const loserIdx = state.order.indexOf(loserId);
      const nextPlayerId = eliminated ? order[loserIdx % order.length] : loserId;

      return {
        state: {
          ...state,
          dice,
          order,
          currentBid: null,
          bidHistory: [],
          currentPlayerId: nextPlayerId,
          lastReveal,
          revealAcks: [],
        },
      };
    }

    return { error: 'Unknown action' };
  },

  viewFor(state, viewer) {
    const base = publicView(state);
    if (viewer.kind === 'tv') return base;
    return { ...base, yourId: viewer.id, yourDice: state.dice[viewer.id] ?? [] };
  },

  isFinished(state) {
    return state.winnerId !== null;
  },
});
