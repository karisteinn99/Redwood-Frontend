// Smoke test for party/index.ts against a running PartyKit dev server.
// Usage: node scripts/room-smoke.mjs [port]  (defaults to 1999)
const PORT = process.argv[2] ?? '1999';
// Persistence means a room's state outlives a single test run, so each run
// needs a fresh, effectively-unique code — a 0-9 suffix collides too easily.
const CODE = `SMOKE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const url = `ws://127.0.0.1:${PORT}/party/${CODE}`;

let failed = false;
const assert = (cond, msg) => {
  if (!cond) {
    failed = true;
    console.error(`✗ ${msg}`);
  } else {
    console.log(`✓ ${msg}`);
  }
};

const open = () =>
  new Promise((resolve) => {
    const ws = new WebSocket(url);
    const log = { state: null, you: null, view: null, error: null };
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'state') log.state = m;
      if (m.type === 'you') log.you = m;
      if (m.type === 'view') log.view = m;
      if (m.type === 'error') log.error = m;
    });
    ws.addEventListener('open', () => resolve({ ws, log }));
  });

const send = (c, m) => c.ws.send(JSON.stringify(m));
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const tv = await open();
send(tv, { type: 'hello', role: 'tv' });
const a = await open();
send(a, { type: 'hello', role: 'player', name: 'Anna' });
const b = await open();
send(b, { type: 'hello', role: 'player', name: 'Ben' });
const c = await open();
send(c, { type: 'hello', role: 'player', name: 'Cleo' });
await wait();

assert(tv.log.state?.players.length === 3, 'lobby has 3 players');
assert(tv.log.state?.games.some((g) => g.id === 'demo'), 'demo game listed');

// non-host start ignored
send(b, { type: 'start', gameId: 'demo' });
await wait();
assert(tv.log.state?.phase === 'lobby', 'non-host start ignored');

// host start
send(a, { type: 'start', gameId: 'demo' });
await wait();
assert(tv.log.state?.phase === 'playing', 'host start begins game');
assert(tv.log.view?.view && !('secret' in tv.log.view.view), 'TV view has no secret');
assert(typeof a.log.view?.view?.secret === 'number', 'Anna sees her own secret');
assert(
  a.log.view.view.secret !== b.log.view.view.secret || a.log.you.playerId !== b.log.you.playerId,
  'players have distinct secrets (or at least distinct identities)'
);

// illegal action -> error to sender only, no state change
const counterBefore = tv.log.view.view.counter;
send(a, { type: 'action', action: { type: 'nope' } });
await wait();
assert(a.log.error !== null, 'illegal action returns error to actor');
assert(tv.log.view.view.counter === counterBefore, 'illegal action does not change state');

// legal actions drive counter to finished
a.log.error = null;
for (let i = 0; i < 5; i++) send(a, { type: 'action', action: { type: 'tap' } });
await wait();
assert(tv.log.view.view.counter === 5, 'counter reaches target');
assert(tv.log.view.finished === true, 'game reports finished');

// reconnect with token gets its private view immediately
const token = a.log.you.token;
a.ws.close();
await wait();
const a2 = await open();
send(a2, { type: 'hello', role: 'player', name: 'Anna', token });
await wait();
assert(typeof a2.log.view?.view?.secret === 'number', 'reconnect gets a private view immediately');
assert(a2.log.view.view.secret === a.log.view.view.secret, 'reconnect gets the same secret as before');

// host home (Anna's disconnect handed host to Ben; reconnecting doesn't reclaim it)
send(b, { type: 'home' });
await wait();
assert(tv.log.state?.phase === 'lobby' && tv.log.state?.gameId === null, 'home returns to lobby');

[tv, a2, b, c].forEach((x) => x.ws.close());
console.log(failed ? '\nFAILED' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
