'use client';

import PartySocket from 'partysocket';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ClientMessage,
  HelloMessage,
  RoomState,
  ServerMessage,
} from '@shared/party-types';

export interface You {
  playerId: string;
  token: string;
}

export interface GameView {
  gameId: string;
  view: unknown;
  finished: boolean;
}

// Connects once `hello` is non-null; re-sends it on every (re)connect.
export function usePartyRoom(code: string, hello: HelloMessage | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [you, setYou] = useState<You | null>(null);
  const [gameView, setGameView] = useState<GameView | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);
  const helloRef = useRef(hello);
  const active = hello !== null;

  useEffect(() => {
    helloRef.current = hello;
  }, [hello]);

  useEffect(() => {
    if (!active) return;

    const socket = new PartySocket({
      host:
        process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
        `${window.location.hostname}:1999`,
      room: code,
    });
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnected(true);
      socket.send(JSON.stringify(helloRef.current));
    });
    socket.addEventListener('close', () => setConnected(false));
    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      if (msg.type === 'state') {
        setState({ phase: msg.phase, players: msg.players, gameId: msg.gameId, games: msg.games });
        if (msg.phase === 'lobby') setGameView(null);
      }
      if (msg.type === 'you') setYou({ playerId: msg.playerId, token: msg.token });
      if (msg.type === 'view') setGameView({ gameId: msg.gameId, view: msg.view, finished: msg.finished });
      if (msg.type === 'error') setLastError(msg.message);
    });

    return () => socket.close();
  }, [code, active]);

  const send = useCallback((msg: ClientMessage) => {
    if (msg.type !== 'hello') setLastError(null); // a new attempt supersedes any stale error
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  return { state, you, gameView, lastError, connected, send };
}
