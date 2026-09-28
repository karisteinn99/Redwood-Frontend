export type Viewer = { kind: 'tv' } | { kind: 'player'; id: string };

export interface GamePlayer {
  id: string;
  name: string;
}

// Server-supplied so reduce/init stay pure and testable.
export interface GameContext {
  random(): number;
  // The current session host's player id, for host-only overrides within a
  // game (e.g. "the host can force everyone past a pending confirmation").
  // null if there is no host yet.
  hostId: string | null;
}

export type ReduceResult<S> = { state: S } | { error: string };

export interface GameInfo {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
}

// State, actions and views must be JSON-serializable.
export interface GameDefinition<S, A, V> extends GameInfo {
  init(players: GamePlayer[], ctx: GameContext): S;
  reduce(state: S, action: A, playerId: string, ctx: GameContext): ReduceResult<S>;
  viewFor(state: S, viewer: Viewer): V;
  isFinished(state: S): boolean;
}

export function defineGame<S, A, V>(def: GameDefinition<S, A, V>): GameDefinition<S, A, V> {
  return def;
}
