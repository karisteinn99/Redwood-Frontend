const CODE = `EDGE-${Date.now().toString(36)}`;
const url = `ws://127.0.0.1:19999/party/${CODE}`;
const open = () => new Promise((resolve) => {
  const ws = new WebSocket(url);
  const log = {};
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    log[m.type] = m;
  });
  ws.addEventListener('open', () => resolve({ ws, log }));
});
const send = (c, m) => c.ws.send(JSON.stringify(m));
const wait = (ms=250) => new Promise(r=>setTimeout(r,ms));

const a = await open();
send(a, { type: 'hello', role: 'player', name: 'Solo' });
await wait();
send(a, { type: 'start', gameId: 'liars-dice' }); // only 1 connected player
await wait();
console.log('error message shown to host:', JSON.stringify(a.log.error));
a.ws.close();
