import type * as Party from 'partykit/server';

import { GAMES, gameInfos } from '../games';
import type { GameContext, Viewer } from '../shared/game';
import type {
  ClientMessage,
  Phase,
  Player,
  RoomState,
  ServerMessage,
} from '../shared/party-types';

interface Seat {
  id: string;
  name: string;
  token: string;
  connId: string | null;
  joinedAt: number;
}

type Role = { role: 'tv' } | { role: 'player'; seatId: string };

const SNAPSHOT_KEY = 'snapshot';

// Bump this whenever a game's state shape changes in a way that could break
// an already-persisted gameState (e.g. a new required field). A stored
// snapshot with a different version has its game dropped back to the lobby
// on load — seats/host are unaffected — instead of restoring a shape the
// current game code doesn't expect.
const GAME_STATE_VERSION = 1;

interface Snapshot {
  gameStateVersion: number;
  phase: Phase;
  seats: Seat[];
  hostId: string | null;
  gameId: string | null;
  gameState: unknown;
}

export default class HomeRoom implements Party.Server {
  private phase: Phase = 'lobby';
  private seats = new Map<string, Seat>();
  private conns = new Map<string, Role>();
  private hostId: string | null = null;
  private gameId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameState: any = null;

  constructor(readonly room: Party.Room) {}

  // Rebuild state after a hibernated room wakes up. Connections never
  // survive a restart, so every seat starts disconnected until its phone
  // reconnects with its token.
  async onStart() {
    const snapshot = await this.room.storage.get<Snapshot>(SNAPSHOT_KEY);
    if (!snapshot) return;
    this.hostId = snapshot.hostId;
    this.seats = new Map(
      snapshot.seats.map((s) => [s.id, { ...s, connId: null }])
    );
    if (snapshot.gameStateVersion !== GAME_STATE_VERSION) return; // stale shape — back to lobby, seats kept
    this.phase = snapshot.phase;
    this.gameId = snapshot.gameId;
    this.gameState = snapshot.gameState;
  }

  onConnect(conn: Party.Connection) {
    conn.send(this.stateMessage());
  }

  onMessage(raw: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === 'hello') {
      if (msg.role === 'tv') {
        this.conns.set(sender.id, { role: 'tv' });
        sender.send(this.stateMessage());
        this.sendView(sender, { kind: 'tv' });
        return;
      }
      this.seatPlayer(sender, msg.name, msg.token);
      return;
    }

    const seat = this.seatOf(sender);
    if (!seat) return;

    // start/home are host-only; any seated player can send a game action.
    if (msg.type === 'action') {
      this.handleAction(sender, seat.id, msg.action);
      return;
    }
    if (seat.id !== this.hostId) return;

    if (msg.type === 'start') {
      this.startGame(sender, msg.gameId);
      return;
    }
    if (msg.type === 'home') {
      this.phase = 'lobby';
      this.gameId = null;
      this.gameState = null;
      this.broadcastState();
      this.persist();
      return;
    }
  }

  onClose(conn: Party.Connection) {
    const seat = this.seatOf(conn);
    this.conns.delete(conn.id);
    if (seat && seat.connId === conn.id) seat.connId = null;
    this.ensureHost();
    this.broadcastState();
    this.persist();
  }

  private startGame(sender: Party.Connection, gameId: string) {
    const fail = (message: string) => {
      const out: ServerMessage = { type: 'error', message };
      sender.send(JSON.stringify(out));
    };

    if (this.phase !== 'lobby') return fail('A game is already in progress');
    const def = GAMES[gameId];
    if (!def) return fail(`Unknown game: ${gameId}`);
    const players = this.players().filter((p) => p.connected);
    if (players.length < def.minPlayers)
      return fail(`${def.name} needs at least ${def.minPlayers} connected players (have ${players.length})`);
    if (players.length > def.maxPlayers)
      return fail(`${def.name} supports at most ${def.maxPlayers} players (have ${players.length})`);

    this.gameId = gameId;
    this.gameState = def.init(players, this.gameCtx());
    this.phase = 'playing';
    this.broadcastState();
    this.broadcastViews();
    this.persist();
  }

  private handleAction(sender: Party.Connection, playerId: string, action: unknown) {
    if (this.phase !== 'playing' || !this.gameId) return;
    const def = GAMES[this.gameId];
    if (!def) return;

    const result = def.reduce(this.gameState, action, playerId, this.gameCtx());
    if ('error' in result) {
      const out: ServerMessage = { type: 'error', message: result.error };
      sender.send(JSON.stringify(out));
      return;
    }
    this.gameState = result.state;
    this.broadcastViews();
    this.persist();
  }

  // hostId can change over time (disconnects), so this is built fresh per call
  // rather than shared, unlike the stateless `random`.
  private gameCtx(): GameContext {
    return { random: () => Math.random(), hostId: this.hostId };
  }

  private sendView(conn: Party.Connection, viewer: Viewer) {
    if (!this.gameId || this.gameState === null) return;
    const def = GAMES[this.gameId];
    if (!def) return;
    const out: ServerMessage = {
      type: 'view',
      gameId: this.gameId,
      view: def.viewFor(this.gameState, viewer),
      finished: def.isFinished(this.gameState),
    };
    conn.send(JSON.stringify(out));
  }

  private broadcastViews() {
    for (const [connId, role] of this.conns) {
      const conn = this.room.getConnection(connId);
      if (!conn) continue;
      const viewer: Viewer =
        role.role === 'tv' ? { kind: 'tv' } : { kind: 'player', id: role.seatId };
      this.sendView(conn, viewer);
    }
  }

  private seatPlayer(conn: Party.Connection, name: string, token?: string) {
    const cleanName = String(name ?? '').trim().slice(0, 20);
    if (!cleanName) return;

    let seat = token
      ? [...this.seats.values()].find((s) => s.token === token)
      : undefined;
    if (seat) {
      seat.name = cleanName;
    } else {
      seat = {
        id: crypto.randomUUID(),
        name: cleanName,
        token: crypto.randomUUID(),
        connId: null,
        joinedAt: Date.now(),
      };
      this.seats.set(seat.id, seat);
    }
    seat.connId = conn.id;
    this.conns.set(conn.id, { role: 'player', seatId: seat.id });
    this.ensureHost();

    const you: ServerMessage = {
      type: 'you',
      playerId: seat.id,
      token: seat.token,
    };
    conn.send(JSON.stringify(you));
    this.broadcastState();
    this.sendView(conn, { kind: 'player', id: seat.id });
    this.persist();
  }

  private seatOf(conn: Party.Connection): Seat | undefined {
    const role = this.conns.get(conn.id);
    return role?.role === 'player' ? this.seats.get(role.seatId) : undefined;
  }

  private ensureHost() {
    const current = this.hostId ? this.seats.get(this.hostId) : undefined;
    if (current?.connId) return;
    const next = [...this.seats.values()]
      .filter((s) => s.connId)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (next) this.hostId = next.id;
  }

  private players(): Player[] {
    return [...this.seats.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((s) => ({
        id: s.id,
        name: s.name,
        isHost: s.id === this.hostId,
        connected: s.connId !== null,
      }));
  }

  private stateMessage(): string {
    const out: ServerMessage = {
      type: 'state',
      phase: this.phase,
      players: this.players(),
      gameId: this.gameId,
      games: gameInfos(),
    } satisfies { type: 'state' } & RoomState;
    return JSON.stringify(out);
  }

  private broadcastState() {
    this.room.broadcast(this.stateMessage());
  }

  private persist() {
    const snapshot: Snapshot = {
      gameStateVersion: GAME_STATE_VERSION,
      phase: this.phase,
      seats: [...this.seats.values()],
      hostId: this.hostId,
      gameId: this.gameId,
      gameState: this.gameState,
    };
    // Fire-and-forget: state is rebuilt from the latest write in onStart,
    // so an occasional dropped write just costs the room's most recent change.
    void this.room.storage.put(SNAPSHOT_KEY, snapshot);
  }
}
