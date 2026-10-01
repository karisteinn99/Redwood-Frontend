// Smoke test for games/go-fish against a running `wrangler dev` server.
// Usage: node scripts/go-fish-smoke.mjs [port]  (defaults to 1999)
//
// Hands are genuinely randomized (ctx.random), so this can't script a fixed
// sequence of exact outcomes — instead it drives the game adaptively (always
// ask for a rank the current player actually holds) inside a bounded guard
// loop, branching on the real result, mirroring liars-dice-smoke.mjs's own
// bounded-retry pattern for handling randomness.
const PORT = process.argv[2] ?? '1999';
const CODE = `FISH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const tv = await open();
send(tv, { type: 'hello', role: 'tv' });
const a = await open();
send(a, { type: 'hello', role: 'player', name: 'Anna' });
const b = await open();
send(b, { type: 'hello', role: 'player', name: 'Ben' });
const c = await open();
send(c, { type: 'hello', role: 'player', name: 'Cleo' });
await wait();

send(a, { type: 'start', gameId: 'go-fish' });
await wait();

const players = [a, b, c];
const byId = Object.fromEntries(players.map((p) => [p.log.you.playerId, p]));

assert(tv.log.state?.phase === 'playing', 'game starts');
assert(tv.log.view?.view && !('yourHand' in tv.log.view.view), 'TV view never contains hand contents');
for (const p of players) {
  assert(Array.isArray(p.log.view?.view?.yourHand), 'each player sees their own hand as an array');
}

const totalCards = () => {
  const v = tv.log.view.view;
  const handTotal = Object.values(v.handCounts).reduce((s, n) => s + n, 0);
  const bookTotal = Object.values(v.books).reduce((s, arr) => s + arr.length, 0);
  return handTotal + bookTotal * 4 + v.stockCount;
};
assert(totalCards() === 52, 'all 52 cards accounted for at game start');

// Deterministic illegal-move checks (always possible regardless of the deal)
const current = () => byId[tv.log.view.view.currentPlayerId];
const cur = current();
const curHand = cur.log.view.view.yourHand;
let missingRank = null;
for (let r = 1; r <= 13; r++) {
  if (!curHand.includes(r)) {
    missingRank = r;
    break;
  }
}
const otherId = players.find((p) => p.log.you.playerId !== cur.log.you.playerId).log.you.playerId;

const nonCurrent = players.find((p) => p !== cur);
send(nonCurrent, { type: 'action', action: { type: 'ask', targetId: otherId, rank: curHand[0] } });
await wait();
assert(nonCurrent.log.error !== null, 'acting out of turn is rejected');

send(cur, { type: 'action', action: { type: 'ask', targetId: cur.log.you.playerId, rank: curHand[0] } });
await wait();
assert(cur.log.error !== null, 'targeting yourself is rejected');

if (missingRank !== null) {
  send(cur, { type: 'action', action: { type: 'ask', targetId: otherId, rank: missingRank } });
  await wait();
  assert(cur.log.error !== null, 'asking for a rank you do not hold is rejected');
}

// Adaptively drive the game to completion. Blind-random target/rank choices
// converge too slowly to bound reliably (a real run needed 500+ turns and
// still hadn't finished) — instead, the harness "cheats" by peeking at every
// player's actual hand (something no real player could do) to always ask a
// guaranteed hit when one exists, falling back to any legal ask otherwise.
// A guaranteed hit always exists whenever the stock is empty and the game
// isn't over: with exactly 4 copies of every rank and none ever destroyed,
// any rank held by the current player but not yet a book of theirs must
// have its other copies somewhere, and once the stock is empty "somewhere"
// can only mean another player's hand.
let guard = 0;
while (!tv.log.view.finished && guard++ < 500) {
  const curP = current();
  const hand = curP.log.view.view.yourHand;
  if (hand.length === 0) {
    await wait(50);
    continue; // resolveTurn hasn't broadcast the free-draw/skip yet
  }
  const others = players.filter((p) => p.log.you.playerId !== curP.log.you.playerId);

  let targetId = null;
  let rank = null;
  outer: for (const r of new Set(hand)) {
    for (const o of others) {
      if (o.log.view.view.yourHand.includes(r)) {
        targetId = o.log.you.playerId;
        rank = r;
        break outer;
      }
    }
  }
  if (rank === null) {
    rank = hand[0];
    targetId = others[Math.floor(Math.random() * others.length)].log.you.playerId;
  }

  send(curP, { type: 'action', action: { type: 'ask', targetId, rank } });
  await wait();
  assert(totalCards() === 52, `card conservation holds (round ${guard})`);
}

assert(guard < 500, 'game reached a finished state within the guard bound');
assert(tv.log.view.finished === true, 'finished game is reported to the TV');
assert(
  Array.isArray(tv.log.view.view.winnerIds) && tv.log.view.view.winnerIds.length > 0,
  'a winner (or tied winners) is declared'
);

[tv, a, b, c].forEach((x) => x.ws.close());
console.log(failed ? '\nFAILED' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
