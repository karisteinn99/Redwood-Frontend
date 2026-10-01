// Plain Cloudflare Worker + Durable Object, deployed via Wrangler.
// Previously ran on PartyKit; migrated off it because PartyKit's managed
// platform had three separate live bugs (broken dashboard login, a shared
// *.partykit.dev zone at Cloudflare's domain cap, and a deploy backend that
// still requests the pre-SQLite Durable Object migration type). See
// AGENTS.md and plans/platform.md for the full story.
//
// The client (partysocket) is unchanged — this Worker's top-level fetch
// replicates PartyKit's own `/parties/main/<room>` URL convention so
// lib/party-host.ts, use-party-room.ts and app/page.tsx's occupancy check
// all keep working exactly as before, just pointed at a different host.
import type {
  DurableObjectNamespace,
  DurableObjectState,
  ExecutionContext,
  WebSocket as PartyWebSocket,
} from '@cloudflare/workers-types';

import { GAMES, gameInfos } from '../games';
import type { GameContext, Viewer } from '../shared/game';
import type {
  ClientMessage,
  Phase,
  Player,
  RoomState,
  ServerMessage,
} from '../shared/party-types';

// WebSocketPair is a genuine Workers runtime global (like `fetch`), not an
// npm-importable value — only its shape needs declaring here, and this
// stays module-local since this file has imports/exports.
declare const WebSocketPair: { new (): { 0: PartyWebSocket; 1: PartyWebSocket } };

interface Env {
  // Unparametrized: we only ever call .fetch() on the stub, no RPC methods,
  // so there's no need for HomeRoom to carry the Rpc.DurableObjectBranded
  // marker that a parametrized DurableObjectNamespace<HomeRoom> requires.
  HOME_ROOM: DurableObjectNamespace;
}

// Persisted per seat. Connection liveness is tracked separately, at
// runtime only (see `liveSockets`) — a raw WebSocket isn't serializable,
// and unlike PartyKit's string connection ids we don't need one: the
// WebSocket object itself is the key.
interface Seat {
  id: string;
  name: string;
  token: string;
  joinedAt: number;
}

type Role = { role: 'tv' } | { role: 'player'; seatId: string };

const SNAPSHOT_KEY = 'snapshot';

// Bump this whenever a game's state shape changes in a way that could break
// an already-persisted gameState (e.g. a new required field). A stored
// snapshot with a different version has its game dropped back to the lobby
// on load — seats/host are unaffected — instead of restoring a shape the
// current game code doesn't expect.
const GAME_STATE_VERSION = 2; // bumped: the demo game was removed from the registry

interface Snapshot {
  gameStateVersion: number;
  phase: Phase;
  seats: Seat[];
  hostId: string | null;
  gameId: string | null;
  gameState: unknown;
}

export class HomeRoom {
  private phase: Phase = 'lobby';
  private seats = new Map<string, Seat>();
  private liveSockets = new Map<string, PartyWebSocket>(); // seatId -> its live socket
  private hostId: string | null = null;
  private gameId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameState: any = null;
  private ready: Promise<void>;

  constructor(private ctx: DurableObjectState) {
    // Rebuild state after a hibernated room wakes up. blockConcurrencyWhile
    // means no request is handled until this finishes — the equivalent of
    // PartyKit's onStart running before onConnect/onRequest.
    this.ready = this.ctx.blockConcurrencyWhile(async () => {
      const snapshot = await this.ctx.storage.get<Snapshot>(SNAPSHOT_KEY);
      if (snapshot) {
        this.hostId = snapshot.hostId;
        this.seats = new Map(snapshot.seats.map((s) => [s.id, s]));
        if (snapshot.gameStateVersion === GAME_STATE_VERSION) {
          this.phase = snapshot.phase;
          this.gameId = snapshot.gameId;
          this.gameState = snapshot.gameState;
        } // else: stale shape — back to lobby, seats kept
      }

      // Hibernation (not a true restart) keeps previously-accepted sockets
      // alive at Cloudflare's edge even though this DO's own JS state was
      // just unloaded and rebuilt from scratch — that's the whole point of
      // the hibernatable WebSockets API. `liveSockets` being a fresh Map
      // here does NOT mean those connections are gone; ctx.getWebSockets()
      // is what still knows about them. Without this, every seat looks
      // disconnected after any hibernate/wake cycle until it happens to
      // send a new message — which silently handed host to whoever
      // (re)joined right after a wake, regardless of true join order.
      for (const ws of this.ctx.getWebSockets()) {
        const role = ws.deserializeAttachment() as Role | null;
        if (role?.role === 'player') this.liveSockets.set(role.seatId, ws);
      }
      this.ensureHost();
    });
  }

  async fetch(request: Request): Promise<Response> {
    await this.ready;

    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.send(this.stateMessage());
      // `webSocket` on ResponseInit is a Workers-only extension DOM's lib
      // doesn't know about — this is the one place that's unavoidable.
      return new Response(null, { status: 101, webSocket: client } as ResponseInit);
    }

    // Plain HTTP GET: lets a client check "is this room code already
    // taken?" before committing to it. `seats` persists (see the
    // constructor above), so this is true even for a since-abandoned room
    // — the code stays retired.
    return new Response(JSON.stringify({ occupied: this.seats.size > 0 }), {
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }

  async webSocketMessage(ws: PartyWebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string') return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === 'hello') {
      if (msg.role === 'tv') {
        ws.serializeAttachment({ role: 'tv' } satisfies Role);
        ws.send(this.stateMessage());
        this.sendView(ws, { kind: 'tv' });
        return;
      }
      this.seatPlayer(ws, msg.name, msg.token);
      return;
    }

    const seat = this.seatOf(ws);
    if (!seat) return;

    // start/home are host-only; any seated player can send a game action.
    if (msg.type === 'action') {
      this.handleAction(ws, seat.id, msg.action);
      return;
    }
    if (seat.id !== this.hostId) return;

    if (msg.type === 'start') {
      this.startGame(ws, msg.gameId);
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

  async webSocketClose(ws: PartyWebSocket) {
    this.handleDisconnect(ws);
  }

  async webSocketError(ws: PartyWebSocket) {
    this.handleDisconnect(ws);
  }

  private handleDisconnect(ws: PartyWebSocket) {
    const seat = this.seatOf(ws);
    if (seat && this.liveSockets.get(seat.id) === ws) this.liveSockets.delete(seat.id);
    this.ensureHost();
    this.broadcastState();
    this.persist();
  }

  private startGame(sender: PartyWebSocket, gameId: string) {
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

  private handleAction(sender: PartyWebSocket, playerId: string, action: unknown) {
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

  private sendView(ws: PartyWebSocket, viewer: Viewer) {
    if (!this.gameId || this.gameState === null) return;
    const def = GAMES[this.gameId];
    if (!def) return;
    const out: ServerMessage = {
      type: 'view',
      gameId: this.gameId,
      view: def.viewFor(this.gameState, viewer),
      finished: def.isFinished(this.gameState),
    };
    ws.send(JSON.stringify(out));
  }

  private broadcastViews() {
    for (const ws of this.ctx.getWebSockets()) {
      const role = ws.deserializeAttachment() as Role | null;
      if (!role) continue;
      const viewer: Viewer = role.role === 'tv' ? { kind: 'tv' } : { kind: 'player', id: role.seatId };
      this.sendView(ws, viewer);
    }
  }

  // Appends " 2", " 3", ... until the name doesn't collide with another
  // seat's — never rejects a join over it, just keeps players visually
  // distinguishable on the TV.
  private uniqueName(base: string, excludeSeatId?: string): string {
    const taken = new Set(
      [...this.seats.values()].filter((s) => s.id !== excludeSeatId).map((s) => s.name),
    );
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
  }

  private seatPlayer(ws: PartyWebSocket, name: string, token?: string) {
    const cleanName = String(name ?? '').trim().slice(0, 20);
    if (!cleanName) return;

    let seat = token
      ? [...this.seats.values()].find((s) => s.token === token)
      : undefined;
    if (seat) {
      seat.name = this.uniqueName(cleanName, seat.id);
    } else {
      seat = {
        id: crypto.randomUUID(),
        name: this.uniqueName(cleanName),
        token: crypto.randomUUID(),
        joinedAt: Date.now(),
      };
      this.seats.set(seat.id, seat);
    }
    this.liveSockets.set(seat.id, ws);
    ws.serializeAttachment({ role: 'player', seatId: seat.id } satisfies Role);
    this.ensureHost();

    const you: ServerMessage = {
      type: 'you',
      playerId: seat.id,
      token: seat.token,
    };
    ws.send(JSON.stringify(you));
    this.broadcastState();
    this.sendView(ws, { kind: 'player', id: seat.id });
    this.persist();
  }

  private seatOf(ws: PartyWebSocket): Seat | undefined {
    const role = ws.deserializeAttachment() as Role | null;
    return role?.role === 'player' ? this.seats.get(role.seatId) : undefined;
  }

  // Host is always the earliest-joined seat that's currently connected —
  // re-evaluated on every join/disconnect, not just assigned once. If the
  // original host's connection drops, host moves to the next-earliest
  // connected player; the moment the original host reconnects, they get it
  // back. If nobody's connected, hostId is left as-is (remembered for
  // whoever reconnects first).
  private ensureHost() {
    const next = [...this.seats.values()]
      .filter((s) => this.liveSockets.has(s.id))
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
        connected: this.liveSockets.has(s.id),
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
    const msg = this.stateMessage();
    for (const ws of this.ctx.getWebSockets()) ws.send(msg);
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
    // Fire-and-forget: state is rebuilt from the latest write in the
    // constructor, so an occasional dropped write just costs the room's
    // most recent change.
    void this.ctx.storage.put(SNAPSHOT_KEY, snapshot);
  }
}

const ROOM_PATH = /^\/parties\/main\/([^/]+)$/;

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const match = ROOM_PATH.exec(url.pathname);
    if (!match) return new Response('Not found', { status: 404 });

    const room = decodeURIComponent(match[1]);
    const id = env.HOME_ROOM.idFromName(room);
    const stub = env.HOME_ROOM.get(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return stub.fetch(request as any) as unknown as Promise<Response>;
  },
};
