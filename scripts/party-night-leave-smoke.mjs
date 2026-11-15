// Smoke test: nobody waits on a player who left, and one real player can
// play alone with bots. Runs against `wrangler dev`.
// Usage: node scripts/party-night-leave-smoke.mjs [port]  (defaults to 1999)
const PORT = process.argv[2] ?? '1999';
const room = () => `LEAVE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

let failed = false;
const assert = (cond, msg) => {
  console[cond ? 'log' : 'error'](`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) failed = true;
};
const open = (code) =>
  new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/parties/main/${code}`);
    const log = { state: null, view: null, error: null };
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'state') log.state = m;
      if (m.type === 'view') log.view = m;
      if (m.type === 'error') log.error = m;
    });
    ws.addEventListener('open', () => resolve({ ws, log }));
  });
const send = (c, m) => c.ws.send(JSON.stringify(m));
const act = (c, action) => send(c, { type: 'action', action });
const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// Alone, with bots.
{
  const code = room();
  const tv = await open(code);
  send(tv, { type: 'hello', role: 'tv' });
  const a = await open(code);
  send(a, { type: 'hello', role: 'player', name: 'Anna' });
  await wait(300);
  send(a, { type: 'start', gameId: 'party-night' });
  await wait();
  assert(tv.log.view?.view.stage === 'setup', 'one player can start The Pickle');
  act(a, { type: 'begin' });
  await wait();
  assert(tv.log.view?.view.bots.length === 3 && tv.log.view.view.stage === 'intro', 'alone, three bots join');
  act(a, { type: 'ready' });
  await wait();
  assert(tv.log.view?.view.stage === 'play', 'ready alone starts the minigame');
  for (const c of [tv, a]) c.ws.close();
}

// Two players, one leaves.
{
  const code = room();
  const tv = await open(code);
  send(tv, { type: 'hello', role: 'tv' });
  const a = await open(code);
  send(a, { type: 'hello', role: 'player', name: 'Anna' });
  await wait(200);
  const b = await open(code);
  send(b, { type: 'hello', role: 'player', name: 'Ben' });
  await wait(300);
  send(a, { type: 'start', gameId: 'party-night' });
  await wait();
  act(a, { type: 'begin' });
  await wait();
  assert(tv.log.view?.view.stage === 'intro', 'two players reach the intro');
  b.ws.close();
  console.log('  (waiting out the 5 s away grace)');
  await wait(6500);
  assert(tv.log.view?.view.gone.length === 1, 'Ben counts as gone');
  act(a, { type: 'ready' });
  await wait();
  assert(tv.log.view?.view.stage === 'play', 'host ready starts it without waiting on Ben');
  for (const c of [tv, a]) c.ws.close();
}

process.exit(failed ? 1 : 0);
