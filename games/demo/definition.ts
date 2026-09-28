import { defineGame } from '@shared/game';

// Throwaway game: proves shared + private state. Replaced by the real sample game.
export interface DemoState {
  counter: number;
  secrets: Record<string, number>;
}

export type DemoAction = { type: 'tap' };

export interface DemoTvView {
  counter: number;
  target: number;
}

export interface DemoPlayerView extends DemoTvView {
  secret: number;
}

const TARGET = 5;

export const demoGame = defineGame<DemoState, DemoAction, DemoTvView | DemoPlayerView>({
  id: 'demo',
  name: 'Tap Demo',
  minPlayers: 1,
  maxPlayers: 8,

  init(players, ctx) {
    const secrets: Record<string, number> = {};
    for (const p of players) secrets[p.id] = Math.floor(ctx.random() * 100);
    return { counter: 0, secrets };
  },

  reduce(state, action, playerId) {
    if (action.type !== 'tap') return { error: `Unknown action: ${(action as { type: string }).type}` };
    if (!(playerId in state.secrets)) return { error: 'Not a player in this game' };
    return { state: { ...state, counter: state.counter + 1 } };
  },

  viewFor(state, viewer) {
    const base = { counter: state.counter, target: TARGET };
    if (viewer.kind === 'tv') return base;
    return { ...base, secret: state.secrets[viewer.id] ?? -1 };
  },

  isFinished(state) {
    return state.counter >= TARGET;
  },
});
