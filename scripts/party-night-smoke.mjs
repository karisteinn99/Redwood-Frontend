// Smoke test for games/party-night against a running `wrangler dev` server.
// Usage: node scripts/party-night-smoke.mjs [port]  (defaults to 1999)
//
// Minigames come in a random order, so this plays whichever one is up,
// adaptively, until someone reaches the top (bounded by a guard).
const PORT = process.argv[2] ?? '1999';
const CODE = `PARTY-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
const act = (c, action) => send(c, { type: 'action', action });
const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));

const tv = await open();
send(tv, { type: 'hello', role: 'tv' });
const a = await open();
send(a, { type: 'hello', role: 'player', name: 'Anna' });
const b = await open();
send(b, { type: 'hello', role: 'player', name: 'Ben' });
const c = await open();
send(c, { type: 'hello', role: 'player', name: 'Cleo' });
await wait(300);

const players = [a, b, c];
assert(tv.log.state?.games.some((g) => g.id === 'party-night'), 'Party night is in the games list');
send(a, { type: 'start', gameId: 'party-night' });
await wait();
assert(tv.log.state?.phase === 'playing', 'party starts');
assert(tv.log.view?.view.stage === 'intro', 'opens on a minigame intro');

act(b, { type: 'go' });
await wait();
assert(b.log.error?.message.includes('host'), 'only the host can start without everyone');
act(a, { type: 'ready' });
act(b, { type: 'ready' });
await wait();
assert(tv.log.view.view.stage === 'intro' && tv.log.view.view.ready.length === 2, 'waits until everyone is ready');
act(c, { type: 'ready' });
await wait();
assert(tv.log.view.view.stage === 'play', 'starts once everyone is ready');

let checkedSecrets = false;
for (let guard = 0; guard < 60 && tv.log.view.view.stage !== 'over'; guard++) {
  const v = tv.log.view.view;
  if (v.stage === 'intro' || v.stage === 'results') {
    for (const p of players) act(p, { type: 'ready' });
    await wait();
    continue;
  }
  const m = v.mini;
  if (m.kind === 'quick-tap') {
    for (const [i, p] of players.entries()) {
      for (let t = 0; t < 3; t++) act(p, { type: 'tap', attempt: t, ms: i === 2 && t === 0 ? -1 : 200 + i * 50 });
    }
    await wait(300);
    const r = tv.log.view.view.result;
    assert(r?.mini === 'quick-tap' && r.placings[0].id === a.log.you.playerId, 'Quick Tap: fastest player places 1st');
    continue;
  }
  if (m.kind === 'versus') {
    if (!checkedSecrets) {
      assert(!('answer' in m.question), 'Knockout: the answer is never sent before everyone picks');
      checkedSecrets = true;
    }
    for (const [i, p] of players.entries()) {
      if (m.alive.includes(p.log.you.playerId)) act(p, { type: 'pick', choice: i === 0 ? 'a' : 'b' });
    }
    await wait(250);
    continue;
  }
  if (m.kind === 'same-pick') {
    act(a, { type: 'choose', option: 0 });
    act(b, { type: 'choose', option: 0 });
    await wait(100);
    assert(!('picks' in tv.log.view.view.mini), 'Same Pick: picks stay hidden while people choose');
    act(c, { type: 'choose', option: 1 });
    await wait(250);
    continue;
  }
}

const end = tv.log.view.view;
assert(end.stage === 'over' && tv.log.view.finished, 'someone reaches the top and the night ends');
assert(end.winnerIds.every((id) => end.steps[id] === 12), 'winners are on step 12');
console.log(`  finished after ${end.round} minigames, steps:`, end.steps);

for (const p of [tv, ...players]) p.ws.close();
process.exit(failed ? 1 : 0);
