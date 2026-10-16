// Smoke test for lobby/host management in party/index.ts against a running
// `wrangler dev` server: avatars, kick, host transfer, the late-join overlay,
// mid-game joiners, and (optionally) pruning of disconnected seats.
//
// Usage: node scripts/lobby-smoke.mjs [port] [pruneGraceMs]
// The prune checks only run when pruneGraceMs is given, and the server must
// have been started with the same value, e.g.
//   npx wrangler dev --port 1999 --var PRUNE_GRACE_MS:1500
//   node scripts/lobby-smoke.mjs 1999 1500
const PORT = process.argv[2] ?? '1999';
const PRUNE_GRACE_MS = process.argv[3] ? Number(process.argv[3]) : null;
const CODE = `LOBBY-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
    const log = {
      state: null,
      you: null,
      view: null,
      error: null,
      kicked: false,
      closed: false,
    };
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'state') log.state = m;
      if (m.type === 'you') log.you = m;
      if (m.type === 'view') log.view = m;
      if (m.type === 'error') log.error = m;
      if (m.type === 'kicked') log.kicked = true;
    });
    ws.addEventListener('close', () => (log.closed = true));
    ws.addEventListener('open', () => resolve({ ws, log }));
  });

const send = (c, m) => c.ws.send(JSON.stringify(m));
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const player = (name) => tv.log.state?.players.find((p) => p.name === name);
const join = async (name, avatar, token) => {
  const c = await open();
  send(c, { type: 'hello', role: 'player', name, avatar, token });
  return c;
};

const tv = await open();
send(tv, { type: 'hello', role: 'tv' });
const a = await join('Anna', '🦊');
await wait(100);
const b = await join('Ben', '🦊'); // taken — server picks a free one
await wait(100);
const c = await join('Cleo', 'not-an-avatar');
await wait();

// avatars
assert(player('Anna')?.avatar === '🦊', 'Anna gets the avatar she asked for');
assert(
  player('Ben')?.avatar && player('Ben').avatar !== '🦊',
  'a taken avatar is swapped for a free one'
);
assert(
  player('Cleo')?.avatar && player('Cleo').avatar !== player('Ben').avatar,
  'an invalid avatar gets a free one'
);
send(b, { type: 'avatar', avatar: '🦊' });
await wait();
assert(
  b.log.error?.message.includes('Anna'),
  "changing to someone else's avatar is rejected"
);
send(b, { type: 'avatar', avatar: '🐙' });
await wait();
assert(player('Ben')?.avatar === '🐙', 'changing to a free avatar works');

// host transfer
send(b, { type: 'transferHost', playerId: player('Cleo').id });
await wait();
assert(player('Anna')?.isHost, 'non-host transfer ignored');
send(a, { type: 'transferHost', playerId: player('Ben').id });
await wait();
assert(
  player('Ben')?.isHost && !player('Anna').isHost,
  'host transfers to Ben'
);
const benToken = b.log.you.token;
b.ws.close();
await wait();
assert(
  player('Anna')?.isHost,
  'host falls back to earliest joiner while Ben is away'
);
const b2 = await join('Ben', undefined, benToken);
await wait();
assert(
  player('Ben')?.isHost,
  'Ben reclaims host on reconnect after a transfer'
);
send(b2, { type: 'transferHost', playerId: player('Anna').id });
await wait();
assert(player('Anna')?.isHost, 'host transferred back to Anna');

// kick
send(c, { type: 'kick', playerId: player('Ben').id });
await wait();
assert(player('Ben'), 'non-host kick ignored');
send(a, { type: 'kick', playerId: player('Anna').id });
await wait();
assert(a.log.error?.message.includes('yourself'), "host can't kick themselves");
send(a, { type: 'kick', playerId: player('Cleo').id });
await wait();
assert(!player('Cleo'), 'host kicks Cleo');
assert(c.log.kicked && c.log.closed, 'kicked player is told and disconnected');
const c2 = await join('Cleo', undefined, c.log.you.token);
await wait();
assert(
  player('Cleo') && c2.log.you.token !== c.log.you.token,
  'a kicked token no longer reclaims the old seat'
);

// game start: kick blocked mid-game, late joiner + overlay
send(a, { type: 'start', gameId: 'go-fish' });
await wait();
assert(tv.log.state?.phase === 'playing', 'game starts');
assert(
  tv.log.state?.gamePlayerIds?.length === 3,
  'gamePlayerIds lists the dealt-in seats'
);
send(a, { type: 'kick', playerId: player('Cleo').id });
await wait();
assert(
  player('Cleo') && a.log.error?.message.includes('Home'),
  'kicking mid-game is rejected with a reason'
);
send(a, { type: 'joinOverlay', open: true });
await wait();
assert(tv.log.state?.joinOverlay === true, 'host opens the late-join overlay');
const d = await join('Dana', '🐼');
await wait();
assert(
  player('Dana') && !tv.log.state.gamePlayerIds.includes(player('Dana').id),
  'mid-game joiner is seated but not dealt in'
);
assert(
  tv.log.state?.joinOverlay === false,
  'overlay closes once someone joins'
);
send(a, { type: 'home' });
await wait();
assert(
  tv.log.state?.phase === 'lobby' && tv.log.state.gamePlayerIds === null,
  'home clears gamePlayerIds'
);

// prune
if (PRUNE_GRACE_MS) {
  d.ws.close();
  await wait(PRUNE_GRACE_MS / 3);
  assert(
    player('Dana'),
    'a disconnected seat survives within the grace period'
  );
  await wait(PRUNE_GRACE_MS + 1500);
  assert(
    !player('Dana'),
    'a seat disconnected past the grace period is pruned'
  );
  assert(player('Anna') && player('Ben'), 'connected seats are never pruned');
} else {
  console.log('- prune checks skipped (pass pruneGraceMs to run them)');
}

[tv, a, b2, c2, d].forEach((x) => x.ws.close());
console.log(failed ? '\nFAILED' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
