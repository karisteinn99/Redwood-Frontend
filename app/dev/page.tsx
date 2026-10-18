'use client';

import { useEffect, useRef, useState } from 'react';

import { generateRoomCode } from '@/lib/room-code';
import { usePartyRoom } from '@/lib/use-party-room';
import type { HelloMessage } from '@shared/party-types';

// The dev bench: one room's TV and any number of phones on one page, so a
// whole game night can be played from a single browser. Each phone is the
// real join page in an iframe with its own seat (`?as=`), auto-joined by
// name (`?name=`). The room and the phones live in the URL, so a refresh
// keeps everyone in their seats.

const NAMES = [
  'Anna',
  'Ben',
  'Cleo',
  'Dani',
  'Egill',
  'Fríða',
  'Gunni',
  'Hekla',
  'Ívar',
  'Jóna',
  'Kalli',
  'Lára',
];

// The bench listens in as a second TV, only to learn who's host and who has
// joined, so phones can join one at a time in order (the first is host).
const TV_HELLO: HelloMessage = { type: 'hello', role: 'tv' };

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
  if (phones.length)
    q.set('p', phones.map((p) => `${p.slot}:${p.name}`).join(','));
  window.history.replaceState(null, '', `/dev?${q}`);
};

function Frame({
  src,
  w,
  h,
  scale,
  reloadKey,
}: {
  src: string;
  w: number;
  h: number;
  scale: number;
  reloadKey: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl bg-black ring-1 ring-white/15"
      style={{ width: w * scale, height: h * scale }}
    >
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
  const { state } = usePartyRoom(room ?? '', room ? TV_HELLO : null);
  const tvBox = useRef<HTMLDivElement>(null);
  const [tvScale, setTvScale] = useState(0.5);

  useEffect(() => {
    const el = tvBox.current;
    if (!el) return;
    const fit = () =>
      setTvScale(
        Math.min(el.clientWidth / 1920, (window.innerHeight * 0.62) / 1080)
      );
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [room]);

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
      const name =
        NAMES.find((n) => !ps.some((p) => p.name === n)) ?? `Player ${slot}`;
      return [...ps, { slot, name }];
    });

  const reload = (id: string) =>
    setReloads((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));

  if (!room) return <div className="min-h-screen bg-gray-900" />;

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="font-bold">Dev bench</p>
        <p className="text-white/50">
          Room <span className="font-mono text-white">{room}</span> ·{' '}
          {phones.length} phone{phones.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={addPhone}
          className="rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500"
        >
          + Add player
        </button>
        <button
          onClick={newRoom}
          className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20"
        >
          New room
        </button>
        <a
          href={`/room/${room}`}
          target="_blank"
          className="text-white/50 underline hover:text-white"
        >
          Open TV in its own tab
        </a>
      </div>

      <div ref={tvBox} className="mb-6 flex flex-col items-center">
        <div className="mb-1 flex items-center gap-3 self-start text-sm text-white/50">
          <span>TV</span>
          <button onClick={() => reload('tv')} className="hover:text-white">
            Reload
          </button>
        </div>
        <Frame
          src={`/room/${room}`}
          w={1920}
          h={1080}
          scale={tvScale}
          reloadKey={reloads.tv ?? 0}
        />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {phones.map((p, i) => {
          const seat = state?.players.find((s) => s.name === p.name);
          // Wait for the phone before this one to be seated, so join order (and host) follows the bench.
          const ready =
            i === 0 ||
            !!state?.players.some((s) => s.name === phones[i - 1].name);
          return (
            <div key={p.slot}>
              <div className="mb-1 flex items-center gap-3 text-sm text-white/50">
                <span className="text-white">{p.name}</span>
                {seat?.isHost && (
                  <span className="rounded bg-white/10 px-1.5 text-xs text-white">
                    host
                  </span>
                )}
                <button
                  onClick={() => reload(`p${p.slot}`)}
                  className="hover:text-white"
                >
                  Reload
                </button>
                <button
                  onClick={() =>
                    setPhones((ps) => ps.filter((x) => x.slot !== p.slot))
                  }
                  className="hover:text-white"
                >
                  Leave
                </button>
              </div>
              {ready ? (
                <Frame
                  src={`/join/${room}?as=${p.slot}&name=${encodeURIComponent(p.name)}`}
                  w={PHONE.w}
                  h={PHONE.h}
                  scale={PHONE_SCALE}
                  reloadKey={reloads[`p${p.slot}`] ?? 0}
                />
              ) : (
                <div
                  className="rounded-xl bg-black/40 ring-1 ring-white/15"
                  style={{
                    width: PHONE.w * PHONE_SCALE,
                    height: PHONE.h * PHONE_SCALE,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
