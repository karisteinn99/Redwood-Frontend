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
import { AVATARS, AVATAR_NAMES, isAvatar } from '../shared/avatars';
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
  // Optional override (e.g. `wrangler dev --var PRUNE_GRACE_MS:2000` for the
  // smoke test); defaults to DEFAULT_PRUNE_GRACE_MS.
  PRUNE_GRACE_MS?: string;
  // Optional override of DEFAULT_AWAY_GRACE_MS.
  AWAY_GRACE_MS?: string;
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
  avatar: string;
  // Persisted (unlike liveness itself) so the prune alarm, which wakes the
  // object from scratch, still knows how long a seat has been gone.
  disconnectedAt?: number;
}

type Role = { role: 'tv' } | { role: 'player'; seatId: string };

const SNAPSHOT_KEY = 'snapshot';

// How long a seat may stay disconnected in the lobby before it's removed.
// Long enough to ride out a locked phone or a tab refresh; short enough that
// people who actually left stop cluttering the guest list.
const DEFAULT_PRUNE_GRACE_MS = 3 * 60 * 1000;

// How long a dropped seat still counts as present (keeps host, isn't shown
// as away) before anyone is told. A page refresh reconnects well within it,
// so nobody sees the host flicker to someone else and back.
const DEFAULT_AWAY_GRACE_MS = 5000;

// Bump this whenever a game's state shape changes in a way that could break
// an already-persisted gameState (e.g. a new required field). A stored
// snapshot with a different version has its game dropped back to the lobby
// on load — seats/host are unaffected — instead of restoring a shape the
// current game code doesn't expect.
const GAME_STATE_VERSION = 3; // bumped: Go Fish cards gained suits (number[] → {rank, suit}[])

interface Snapshot {
  gameStateVersion: number;
  phase: Phase;
  seats: Seat[];
  hostId: string | null;
  preferredHostId?: string | null;
  gameId: string | null;
  gameState: unknown;
  gamePlayerIds?: string[] | null;
  joinOverlay?: boolean;
  pickedGameId?: string | null;
}

export class HomeRoom {
  private phase: Phase = 'lobby';
  private seats = new Map<string, Seat>();
  private liveSockets = new Map<string, PartyWebSocket>(); // seatId -> its live socket
  private hostId: string | null = null;
  // Set by an explicit host transfer: this seat outranks join order for as
  // long as it's connected (see ensureHost).
  private preferredHostId: string | null = null;
  private gameId: string | null = null;
  private gamePlayerIds: string[] | null = null;
  private joinOverlay = false;
  private pickedGameId: string | null = null;
  private pruneGraceMs: number;
  private awayGraceMs: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameState: any = null;
  private ready: Promise<void>;

  constructor(private ctx: DurableObjectState, env: Env) {
    this.pruneGraceMs = Number(env.PRUNE_GRACE_MS) || DEFAULT_PRUNE_GRACE_MS;
    this.awayGraceMs = Number(env.AWAY_GRACE_MS) || DEFAULT_AWAY_GRACE_MS;
    // Rebuild state after a hibernated room wakes up. blockConcurrencyWhile
    // means no request is handled until this finishes — the equivalent of
    // PartyKit's onStart running before onConnect/onRequest.
    this.ready = this.ctx.blockConcurrencyWhile(async () => {
      const snapshot = await this.ctx.storage.get<Snapshot>(SNAPSHOT_KEY);
      if (snapshot) {
        this.hostId = snapshot.hostId;
        this.preferredHostId = snapshot.preferredHostId ?? null;
        // Seats persisted before avatars existed, or with an old emoji
        // character, get a free token on load.
        this.seats = new Map();
        for (const s of snapshot.seats) {
          this.seats.set(s.id, { ...s, avatar: isAvatar(s.avatar) ? s.avatar : this.pickAvatar(undefined) });
        }
        if (snapshot.gameStateVersion === GAME_STATE_VERSION) {
          this.phase = snapshot.phase;
          this.gameId = snapshot.gameId;
          this.gameState = snapshot.gameState;
          this.gamePlayerIds = snapshot.gamePlayerIds ?? null;
          this.joinOverlay = snapshot.joinOverlay ?? false;
          this.pickedGameId = snapshot.pickedGameId ?? null;
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
      const now = Date.now();
      for (const seat of this.seats.values()) {
        if (this.liveSockets.has(seat.id)) delete seat.disconnectedAt;
        else seat.disconnectedAt ??= now;
      }
      this.ensureHost();
      await this.scheduleAlarm();
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
    // — the code stays retired. A connected TV counts too, so a room whose
    // TV is up but nobody has joined yet isn't handed out twice.
    const occupied = this.seats.size > 0 || this.ctx.getWebSockets().length > 0;
    return new Response(JSON.stringify({ occupied }), {
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
      this.seatPlayer(ws, msg.name, msg.token, msg.avatar);
      return;
    }

    const seat = this.seatOf(ws);
    if (!seat) return;

    // Any seated player can send a game action or change their own avatar;
    // everything else is host-only.
    if (msg.type === 'action') {
      this.handleAction(ws, seat.id, msg.action);
      return;
    }
    if (msg.type === 'avatar') {
      this.setAvatar(ws, seat, msg.avatar);
      return;
    }
    if (msg.type === 'leave') {
      this.leave(ws, seat);
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
      this.gamePlayerIds = null;
      this.joinOverlay = false;
      this.broadcastState();
      this.persist();
      await this.scheduleAlarm(); // seats that dropped mid-game are prunable again
      return;
    }
    if (msg.type === 'pick') {
      if (this.phase !== 'lobby') return;
      this.pickedGameId = msg.gameId && GAMES[msg.gameId] ? msg.gameId : null;
      this.broadcastState();
      this.persist();
      return;
    }
    if (msg.type === 'kick') {
      this.kick(ws, seat, msg.playerId);
      return;
    }
    if (msg.type === 'transferHost') {
      this.transferHost(ws, seat, msg.playerId);
      return;
    }
    if (msg.type === 'joinOverlay') {
      this.joinOverlay = this.phase === 'playing' && msg.open === true;
      this.broadcastState();
      this.persist();
      return;
    }
  }

  // Durable Object alarm: removes lobby seats that have been disconnected
  // longer than the grace period. Never runs mid-game — those seats are
  // part of the game state and keep their place until everyone's home.
  // Also fires when a dropped seat's away grace runs out, so host and the
  // "away" mark catch up with who actually left.
  async alarm() {
    await this.ready;
    if (this.phase === 'lobby') {
      const cutoff = Date.now() - this.pruneGraceMs;
      for (const seat of [...this.seats.values()]) {
        if (this.liveSockets.has(seat.id) || seat.disconnectedAt === undefined) continue;
        if (seat.disconnectedAt > cutoff) continue;
        this.removeSeat(seat.id);
      }
    }
    this.ensureHost();
    this.broadcastState();
    this.persist();
    await this.scheduleAlarm();
  }

  async webSocketClose(ws: PartyWebSocket) {
    this.handleDisconnect(ws);
  }

  async webSocketError(ws: PartyWebSocket) {
    this.handleDisconnect(ws);
  }

  private handleDisconnect(ws: PartyWebSocket) {
    const seat = this.seatOf(ws);
    if (seat && this.liveSockets.get(seat.id) === ws) {
      this.liveSockets.delete(seat.id);
      seat.disconnectedAt = Date.now();
    }
    this.ensureHost();
    this.broadcastState();
    this.persist();
    void this.scheduleAlarm();
  }

  private async scheduleAlarm() {
    const now = Date.now();
    const deadlines: number[] = [];
    for (const s of this.seats.values()) {
      if (this.liveSockets.has(s.id) || s.disconnectedAt === undefined) continue;
      if (s.disconnectedAt + this.awayGraceMs > now) deadlines.push(s.disconnectedAt + this.awayGraceMs);
      if (this.phase === 'lobby') deadlines.push(s.disconnectedAt + this.pruneGraceMs);
    }
    if (deadlines.length) await this.ctx.storage.setAlarm(Math.min(...deadlines));
  }

  // Connected, or dropped so recently it may just be a refresh.
  private present(seat: Seat): boolean {
    if (this.liveSockets.has(seat.id)) return true;
    return seat.disconnectedAt !== undefined && Date.now() - seat.disconnectedAt < this.awayGraceMs;
  }

  private removeSeat(seatId: string) {
    this.seats.delete(seatId);
    this.liveSockets.delete(seatId);
    if (this.preferredHostId === seatId) this.preferredHostId = null;
  }

  // A player leaving on their own, from their phone. Like being removed, it
  // only happens at Home: mid-game the seat is part of the game's state.
  private leave(ws: PartyWebSocket, seat: Seat) {
    if (this.phase !== 'lobby') return this.fail(ws, 'You can leave once everyone is back home');
    this.removeSeat(seat.id);
    ws.serializeAttachment(null);
    try {
      ws.close(1000, 'Left');
    } catch {
      // already closing
    }
    this.ensureHost();
    this.broadcastState();
    this.persist();
  }

  private kick(sender: PartyWebSocket, host: Seat, targetId: string) {
    const target = this.seats.get(targetId);
    if (!target) return this.fail(sender, 'That player has already left');
    if (target.id === host.id) return this.fail(sender, "You can't remove yourself");
    // Mid-game the seat is part of the game's own state (turn order, hands);
    // pulling it out from under the game isn't something every game handles.
    if (this.phase !== 'lobby') return this.fail(sender, 'Players can only be removed at Home, between games');

    const socket = this.liveSockets.get(target.id);
    this.removeSeat(target.id);
    if (socket) {
      socket.serializeAttachment(null);
      this.safeSend(socket, JSON.stringify({ type: 'kicked' } satisfies ServerMessage));
      try {
        socket.close(4000, 'Removed by the host');
      } catch {
        // already closing
      }
    }
    this.ensureHost();
    this.broadcastState();
    this.persist();
  }

  private transferHost(sender: PartyWebSocket, host: Seat, targetId: string) {
    const target = this.seats.get(targetId);
    if (!target || target.id === host.id) return this.fail(sender, 'Pick another player');
    if (!this.liveSockets.has(target.id)) return this.fail(sender, `${target.name} isn't connected right now`);
    this.preferredHostId = target.id;
    this.ensureHost();
    this.broadcastState();
    this.persist();
  }

  private setAvatar(sender: PartyWebSocket, seat: Seat, avatar: string) {
    if (!isAvatar(avatar)) return this.fail(sender, 'Unknown character');
    const owner = [...this.seats.values()].find((s) => s.avatar === avatar && s.id !== seat.id);
    if (owner) return this.fail(sender, `${owner.name} is already ${AVATAR_NAMES[avatar]}`);
    seat.avatar = avatar;
    this.broadcastState();
    this.persist();
  }

  // A requested avatar if it's valid and free, else the first free one. With
  // more seats than characters, duplicates are allowed rather than refusing
  // the join.
  private pickAvatar(requested: unknown, excludeSeatId?: string): string {
    const taken = new Set(
      [...this.seats.values()].filter((s) => s.id !== excludeSeatId).map((s) => s.avatar),
    );
    if (isAvatar(requested) && !taken.has(requested)) return requested;
    return AVATARS.find((a) => !taken.has(a)) ?? (isAvatar(requested) ? requested : AVATARS[0]);
  }

  private fail(ws: PartyWebSocket, message: string) {
    this.safeSend(ws, JSON.stringify({ type: 'error', message } satisfies ServerMessage));
  }

  // A socket that's mid-close can still be listed by getWebSockets(); a
  // send to it throws, and one bad socket mustn't abort a broadcast.
  private safeSend(ws: PartyWebSocket, msg: string) {
    try {
      ws.send(msg);
    } catch {
      // closed or closing
    }
  }

  private startGame(sender: PartyWebSocket, gameId: string) {
    const fail = (message: string) => this.fail(sender, message);

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
    this.gamePlayerIds = players.map((p) => p.id);
    this.joinOverlay = false;
    this.pickedGameId = null;
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
    if ('error' in result) return this.fail(sender, result.error);
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
    this.safeSend(ws, JSON.stringify(out));
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

  private seatPlayer(ws: PartyWebSocket, name: string, token?: string, avatar?: string) {
    const cleanName = String(name ?? '').trim().slice(0, 20);
    if (!cleanName) return;

    let seat = token
      ? [...this.seats.values()].find((s) => s.token === token)
      : undefined;
    if (seat) {
      seat.name = this.uniqueName(cleanName, seat.id);
      if (avatar !== undefined && avatar !== seat.avatar) seat.avatar = this.pickAvatar(avatar, seat.id);
    } else {
      seat = {
        id: crypto.randomUUID(),
        name: this.uniqueName(cleanName),
        token: crypto.randomUUID(),
        joinedAt: Date.now(),
        avatar: this.pickAvatar(avatar),
      };
      this.seats.set(seat.id, seat);
      this.joinOverlay = false; // they're in — the TV can drop the QR again
    }
    delete seat.disconnectedAt;
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
  // back. An explicit transfer (`preferredHostId`) jumps the queue the same
  // way: that seat holds host whenever it's connected. If nobody's
  // connected, hostId is left as-is (remembered for whoever reconnects
  // first) — unless that seat was just removed.
  private ensureHost() {
    const preferred = this.preferredHostId ? this.seats.get(this.preferredHostId) : undefined;
    if (preferred && this.present(preferred)) {
      this.hostId = this.preferredHostId;
      return;
    }
    const next = [...this.seats.values()]
      .filter((s) => this.present(s))
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (next) this.hostId = next.id;
    else if (this.hostId && !this.seats.has(this.hostId)) this.hostId = null;
  }

  private players(): Player[] {
    return [...this.seats.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((s) => ({
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        isHost: s.id === this.hostId,
        connected: this.present(s),
      }));
  }

  private stateMessage(): string {
    const out: ServerMessage = {
      type: 'state',
      phase: this.phase,
      players: this.players(),
      gameId: this.gameId,
      gamePlayerIds: this.gamePlayerIds,
      joinOverlay: this.joinOverlay,
      pickedGameId: this.pickedGameId,
      games: gameInfos(),
    } satisfies { type: 'state' } & RoomState;
    return JSON.stringify(out);
  }

  private broadcastState() {
    const msg = this.stateMessage();
    for (const ws of this.ctx.getWebSockets()) this.safeSend(ws, msg);
  }

  private persist() {
    const snapshot: Snapshot = {
      gameStateVersion: GAME_STATE_VERSION,
      phase: this.phase,
      seats: [...this.seats.values()],
      hostId: this.hostId,
      preferredHostId: this.preferredHostId,
      gameId: this.gameId,
      gameState: this.gameState,
      gamePlayerIds: this.gamePlayerIds,
      joinOverlay: this.joinOverlay,
      pickedGameId: this.pickedGameId,
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
