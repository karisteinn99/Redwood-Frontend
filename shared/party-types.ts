import type { GameInfo } from './game';

export type Phase = 'lobby' | 'playing';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

export interface RoomState {
  phase: Phase;
  players: Player[];
  gameId: string | null;
  games: GameInfo[];
}

export type HelloMessage =
  | { type: 'hello'; role: 'tv' }
  | { type: 'hello'; role: 'player'; name: string; token?: string };

export type ClientMessage =
  | HelloMessage
  | { type: 'start'; gameId: string }
  | { type: 'action'; action: unknown }
  | { type: 'home' };

export type ServerMessage =
  | ({ type: 'state' } & RoomState)
  | { type: 'you'; playerId: string; token: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'view'; gameId: string; view: any; finished: boolean }
  | { type: 'error'; message: string };
