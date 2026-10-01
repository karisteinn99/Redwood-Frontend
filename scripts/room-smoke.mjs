// Smoke test for party/index.ts against a running `wrangler dev` server.
// Usage: node scripts/room-smoke.mjs [port]  (defaults to 1999)
//
// Platform-level behavior only (lobby, host election/reassignment, illegal
// actions, reconnect, home) — uses Liar's Dice purely as "a game" to start
// and check view-splitting, without playing it to completion. Reaching a
// finished/winner state is already deeply covered by liars-dice-smoke.mjs;
// re-deriving that here would just duplicate it and couple this test to one
// game's win condition.
const PORT = process.argv[2] ?? '1999';
// Persistence means a room's state outlives a single test run, so each run
// needs a fresh, effectively-unique code — a 0-9 suffix collides too easily.
const CODE = `SMOKE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const url = `ws://127.0.0.1:${PORT}/parties/main/${CODE}`;

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
assert(tv.log.state?.games.some((g) => g.id === 'liars-dice'), "liars-dice game listed");

// non-host start ignored
send(b, { type: 'start', gameId: 'liars-dice' });
await wait();
assert(tv.log.state?.phase === 'lobby', 'non-host start ignored');

// host start
send(a, { type: 'start', gameId: 'liars-dice' });
await wait();
assert(tv.log.state?.phase === 'playing', 'host start begins game');
assert(tv.log.view?.view && !('yourDice' in tv.log.view.view), 'TV view has no dice');
assert(Array.isArray(a.log.view?.view?.yourDice), 'Anna sees her own dice');
assert(
  JSON.stringify(a.log.view.view.yourDice) !== JSON.stringify(b.log.view.view.yourDice) ||
    a.log.you.playerId !== b.log.you.playerId,
  'players have distinct dice (or at least distinct identities)'
);

// illegal action -> error to sender only, no state change
const before = JSON.stringify(tv.log.view.view);
send(a, { type: 'action', action: { type: 'nope' } });
await wait();
assert(a.log.error !== null, 'illegal action returns error to actor');
assert(JSON.stringify(tv.log.view.view) === before, 'illegal action does not change state');

// reconnect with token gets its private view immediately
const token = a.log.you.token;
a.ws.close();
await wait();
assert(
  tv.log.state?.players.find((p) => p.name === 'Ben')?.isHost === true,
  "host moves to Ben (earliest still-connected) while Anna is disconnected"
);

const a2 = await open();
send(a2, { type: 'hello', role: 'player', name: 'Anna', token });
await wait();
assert(Array.isArray(a2.log.view?.view?.yourDice), 'reconnect gets a private view immediately');
assert(
  JSON.stringify(a2.log.view.view.yourDice) === JSON.stringify(a.log.view.view.yourDice),
  'reconnect gets the same dice as before'
);
assert(
  tv.log.state?.players.find((p) => p.name === 'Anna')?.isHost === true,
  'Anna reclaims host on reconnect (earliest joiner, standing rule)'
);

// host home (Anna is host again after reconnecting)
send(a2, { type: 'home' });
await wait();
assert(tv.log.state?.phase === 'lobby' && tv.log.state?.gameId === null, 'home returns to lobby');

[tv, a2, b, c].forEach((x) => x.ws.close());
console.log(failed ? '\nFAILED' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
