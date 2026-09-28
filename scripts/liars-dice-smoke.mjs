// Smoke test for games/liars-dice against a running `wrangler dev` server.
// Usage: node scripts/liars-dice-smoke.mjs [port]  (defaults to 1999)
const PORT = process.argv[2] ?? '1999';
// Persistence means a room's state outlives a single test run, so each run
// needs a fresh, effectively-unique code — a 0-9 suffix collides too easily.
const CODE = `DICE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
send(a, { type: 'hello', role: 'player', name: 'Anna' }); // host, bids first
const b = await open();
send(b, { type: 'hello', role: 'player', name: 'Ben' });
const c = await open();
send(c, { type: 'hello', role: 'player', name: 'Cleo' });
await wait();

send(a, { type: 'start', gameId: 'liars-dice' });
await wait();

assert(tv.log.state?.phase === 'playing', 'game starts');
assert(!('dice' in tv.log.view.view), 'TV view never contains hidden dice');
assert(Array.isArray(a.log.view.view.yourDice) && a.log.view.view.yourDice.length === 5, 'Anna sees her own 5 dice');
assert(!('yourDice' in tv.log.view.view), 'TV view has no yourDice field at all');
assert(tv.log.view.view.diceCounts[a.log.you.playerId] === 5, 'TV sees dice counts, not values');

// non-current player can't act
send(b, { type: 'action', action: { type: 'bid', quantity: 1, face: 2 } });
await wait();
assert(b.log.error !== null, 'acting out of turn is rejected');
assert(tv.log.view.view.currentBid === null, "out-of-turn bid didn't change state");

// Anna (current) makes an opening bid
send(a, { type: 'action', action: { type: 'bid', quantity: 2, face: 3 } });
await wait();
assert(tv.log.view.view.currentBid?.quantity === 2 && tv.log.view.view.currentBid?.face === 3, 'opening bid recorded');
assert(tv.log.view.view.currentPlayerId === b.log.you.playerId, 'turn advances to Ben');

// a lower/equal bid is rejected
send(b, { type: 'action', action: { type: 'bid', quantity: 2, face: 2 } });
await wait();
assert(b.log.error !== null, 'a non-raising bid is rejected');

// a legal raise is accepted
b.log.error = null;
send(b, { type: 'action', action: { type: 'bid', quantity: 3, face: 3 } });
await wait();
assert(b.log.error === null, 'a legal raise is accepted');
assert(tv.log.view.view.currentPlayerId === c.log.you.playerId, 'turn advances to Cleo');

// Cleo challenges Ben's bid
send(c, { type: 'action', action: { type: 'challenge' } });
await wait();

const reveal = tv.log.view.view.lastReveal;
assert(reveal !== null, 'a challenge produces a public reveal');
assert(Object.keys(reveal.allDice).length === 3, 'reveal shows all three players dice');
assert(reveal.bidderId === b.log.you.playerId, 'reveal records who made the challenged bid');
assert(reveal.challengerId === c.log.you.playerId, 'reveal records the challenger');

const loserId = reveal.loserId;
const loserCountBefore = 5;
const loserCountAfter = tv.log.view.view.diceCounts[loserId];
assert(loserCountAfter === loserCountBefore - 1, 'the loser of the challenge has one fewer die');
assert(tv.log.view.view.currentPlayerId === loserId, "the loser opens the next round's bidding");
assert(tv.log.view.view.currentBid === null, 'the bid resets after a challenge (state already advanced)');
assert(tv.log.view.view.bidHistory.length === 0, 'the bid history resets after a challenge');

// the game is genuinely paused, not just hidden by the UI: bidding is blocked
// while a reveal is pending acknowledgment
send(a, { type: 'action', action: { type: 'bid', quantity: 1, face: 2 } });
await wait();
assert(a.log.error !== null, 'bidding is blocked while a reveal is pending acknowledgment');
a.log.error = null;

// a single non-host continue doesn't clear the reveal
send(b, { type: 'action', action: { type: 'continue' } });
await wait();
assert(tv.log.view.view.lastReveal !== null, "one player's continue alone doesn't clear the reveal");
assert(tv.log.view.view.revealAcks.includes(b.log.you.playerId), 'the ack is recorded');

// nor does a second one, with the host (Anna) still silent
send(c, { type: 'action', action: { type: 'continue' } });
await wait();
assert(tv.log.view.view.lastReveal !== null, 'still pending until the host, or everyone, continues');

// the host can force everyone past it immediately
send(a, { type: 'action', action: { type: 'continue' } });
await wait();
assert(tv.log.view.view.lastReveal === null, "the host's continue clears the reveal for everyone");

// play down to a winner: everyone just challenges the reigning bidder's raises,
// forcing dice off one at a time until only one player is left. The host
// fast-forwards past every reveal with its own continue.
let guard = 0;
while (tv.log.view.view.winnerId === null && guard++ < 300) {
  const v = tv.log.view.view;
  if (v.lastReveal) {
    send(a, { type: 'action', action: { type: 'continue' } });
    await wait(60);
    continue;
  }
  const turnId = v.currentPlayerId;
  const actor = [a, b, c].find((p) => p.log.you.playerId === turnId);
  const bid = v.currentBid;
  if (!bid) {
    send(actor, { type: 'action', action: { type: 'bid', quantity: 1, face: 2 } });
  } else {
    send(actor, { type: 'action', action: { type: 'challenge' } });
  }
  await wait(60);
}

assert(guard < 300, 'game reaches a winner within a bounded number of rounds');
assert(typeof tv.log.view.view.winnerId === 'string', 'a winner is declared');
assert(tv.log.view.finished === true, 'finished game is reported to the TV');

[tv, a, b, c].forEach((x) => x.ws.close());
console.log(failed ? '\nFAILED' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
