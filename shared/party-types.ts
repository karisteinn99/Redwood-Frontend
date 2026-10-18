import type { GameInfo } from './game';

export type Phase = 'lobby' | 'playing';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  connected: boolean;
}

export interface RoomState {
  phase: Phase;
  players: Player[];
  gameId: string | null;
  // Seats dealt into the running game; anyone else seated joined mid-game
  // and waits for the next one. null in the lobby.
  gamePlayerIds: string[] | null;
  // Host-toggled "let someone in" QR overlay on the TV during a game.
  joinOverlay: boolean;
  // The game the host has opened at Home but not started yet. Lobby only.
  pickedGameId: string | null;
  games: GameInfo[];
}

export type HelloMessage =
  | { type: 'hello'; role: 'tv' }
  | { type: 'hello'; role: 'player'; name: string; token?: string; avatar?: string };

export type ClientMessage =
  | HelloMessage
  | { type: 'start'; gameId: string }
  | { type: 'action'; action: unknown }
  | { type: 'home' }
  | { type: 'avatar'; avatar: string }
  // Host-only from here down.
  | { type: 'pick'; gameId: string | null }
  | { type: 'kick'; playerId: string }
  | { type: 'transferHost'; playerId: string }
  | { type: 'joinOverlay'; open: boolean };

export type ServerMessage =
  | ({ type: 'state' } & RoomState)
  | { type: 'you'; playerId: string; token: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'view'; gameId: string; view: any; finished: boolean }
  | { type: 'error'; message: string }
  // Sent right before the server closes a kicked player's socket; the client
  // must stop reconnecting and forget its token.
  | { type: 'kicked' };
