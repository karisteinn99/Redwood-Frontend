'use client';

import { useEffect, useState } from 'react';

import { generateRoomCode } from '@/lib/room-code';

// The dev bench: one room's TV and any number of phones on one page, so a
// whole game night can be played from a single browser. Each phone is the
// real join page in an iframe with its own seat (`?as=`), auto-joined by
// name (`?name=`). The room and the phones live in the URL, so a refresh
// keeps everyone in their seats.

const NAMES = ['Anna', 'Ben', 'Cleo', 'Dani', 'Egill', 'Fríða', 'Gunni', 'Hekla', 'Ívar', 'Jóna', 'Kalli', 'Lára'];

const TV_SCALE = 0.5;
const PHONE = { w: 390, h: 844 };
const PHONE_SCALE = 0.72;

interface Phone {
  slot: number;
  name: string;
}

const readUrl = () => {
  const q = new URLSearchParams(window.location.search);
  const phones = (q.get('p') ?? '')
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [slot, name] = entry.split(':');
      return { slot: Number(slot), name };
    });
  return { room: q.get('room'), phones };
};

const writeUrl = (room: string, phones: Phone[]) => {
  const q = new URLSearchParams({ room });
  if (phones.length) q.set('p', phones.map((p) => `${p.slot}:${p.name}`).join(','));
  window.history.replaceState(null, '', `/dev?${q}`);
};

function Frame({ src, w, h, scale, reloadKey }: { src: string; w: number; h: number; scale: number; reloadKey: number }) {
  return (
    <div className="overflow-hidden rounded-xl bg-black ring-1 ring-white/15" style={{ width: w * scale, height: h * scale }}>
      <iframe
        key={reloadKey}
        src={src}
        width={w}
        height={h}
        className="origin-top-left border-0"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}

export default function DevBench() {
  const [room, setRoom] = useState<string | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [reloads, setReloads] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = readUrl();
    if (saved.room) {
      setRoom(saved.room);
      setPhones(saved.phones);
    } else {
      newRoom();
    }
  }, []);

  useEffect(() => {
    if (room) writeUrl(room, phones);
  }, [room, phones]);

  const newRoom = () => {
    setRoom(generateRoomCode());
    setPhones([
      { slot: 1, name: NAMES[0] },
      { slot: 2, name: NAMES[1] },
    ]);
  };

  const addPhone = () =>
    setPhones((ps) => {
      const slot = Math.max(0, ...ps.map((p) => p.slot)) + 1;
      const name = NAMES.find((n) => !ps.some((p) => p.name === n)) ?? `Player ${slot}`;
      return [...ps, { slot, name }];
    });

  const reload = (id: string) => setReloads((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));

  if (!room) return <div className="min-h-screen bg-gray-900" />;

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="font-bold">Dev bench</p>
        <p className="text-white/50">
          Room <span className="font-mono text-white">{room}</span> · {phones.length} phone{phones.length === 1 ? '' : 's'}
        </p>
        <button onClick={addPhone} className="rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500">
          + Add player
        </button>
        <button onClick={newRoom} className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
          New room
        </button>
        <a href={`/room/${room}`} target="_blank" className="text-white/50 underline hover:text-white">
          Open TV in its own tab
        </a>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div>
          <div className="mb-1 flex items-center gap-3 text-sm text-white/50">
            <span>TV</span>
            <button onClick={() => reload('tv')} className="hover:text-white">
              Reload
            </button>
          </div>
          <Frame src={`/room/${room}`} w={1920} h={1080} scale={TV_SCALE} reloadKey={reloads.tv ?? 0} />
        </div>

        {phones.map((p) => (
          <div key={p.slot}>
            <div className="mb-1 flex items-center gap-3 text-sm text-white/50">
              <span className="text-white">{p.name}</span>
              <button onClick={() => reload(`p${p.slot}`)} className="hover:text-white">
                Reload
              </button>
              <button onClick={() => setPhones((ps) => ps.filter((x) => x.slot !== p.slot))} className="hover:text-white">
                Leave
              </button>
            </div>
            <Frame
              src={`/join/${room}?as=${p.slot}&name=${encodeURIComponent(p.name)}`}
              w={PHONE.w}
              h={PHONE.h}
              scale={PHONE_SCALE}
              reloadKey={reloads[`p${p.slot}`] ?? 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
