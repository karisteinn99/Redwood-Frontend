'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';

export interface WaveSource {
  x: number;
  y: number;
  rgb: [number, number, number];
}

export interface HomeFieldHandle {
  // Sends a wave from source `i`, or from the next one in turn.
  sendWave: (i?: number) => void;
}

const W = 1920, H = 1080, MOTES = 260, SPEED = 9, BAND = 70, REACH = 2300, PERIOD = 10000;

// The house breathing (see the design system's HomeWall): faint warm motes
// drift up the wall, and every ~10 s an invisible wave leaves the next room
// window, lighting the motes it passes in that room's colour. `onBreath`
// lets the window itself bloom as its wave leaves.
export function HomeField({
  sources,
  onBreath,
  ref,
}: {
  sources: () => WaveSource[];
  onBreath: (i: number) => void;
  ref?: Ref<HomeFieldHandle>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const waves = useRef<{ x: number; y: number; r: number; rgb: [number, number, number] }[]>([]);
  const next = useRef(0);
  const timer = useRef(0);
  const latest = useRef({ sources, onBreath });
  latest.current = { sources, onBreath };

  const sendWave = (i?: number) => {
    const all = latest.current.sources();
    if (all.length === 0) return;
    const idx = i ?? next.current++ % all.length;
    const s = all[idx];
    if (!s) return;
    timer.current = 0;
    waves.current.push({ x: s.x, y: s.y, r: 0, rgb: s.rgb });
    latest.current.onBreath(idx);
  };
  useImperativeHandle(ref, () => ({ sendWave }));

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motes = Array.from({ length: MOTES }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.8 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -0.05 - Math.random() * 0.12,
      base: 0.05 + Math.random() * 0.12,
      lit: 0,
      rgb: [255, 220, 170] as [number, number, number],
      tw: Math.random() * 6.28,
    }));
    let last = performance.now();
    let raf = 0;
    const first = reduced ? undefined : setTimeout(() => sendWave(), 1500);

    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);
      if (!reduced) {
        timer.current += dt;
        if (timer.current > PERIOD) sendWave();
      }
      const ws = waves.current;
      for (let w = ws.length - 1; w >= 0; w--) {
        ws[w].r += (SPEED * dt) / 16.7;
        if (ws[w].r > REACH) ws.splice(w, 1);
      }
      for (const m of motes) {
        if (!reduced) {
          m.x += (m.vx * dt) / 16.7;
          m.y += (m.vy * dt) / 16.7;
          m.tw += dt * 0.0012;
        }
        if (m.y < -4) {
          m.y = H + 4;
          m.x = Math.random() * W;
        }
        if (m.x < -4) m.x = W + 4;
        if (m.x > W + 4) m.x = -4;
        for (const wv of ws) {
          const off = Math.abs(Math.hypot(m.x - wv.x, m.y - wv.y) - wv.r);
          if (off < BAND) {
            const hit = (1 - off / BAND) * Math.max(0, 1 - wv.r / REACH);
            if (hit > m.lit) {
              m.lit = hit;
              m.rgb = wv.rgb;
            }
          }
        }
        m.lit *= Math.pow(0.985, dt / 16.7);
        const a = m.base * (0.75 + 0.25 * Math.sin(m.tw)) + m.lit * 0.85;
        const col = m.lit > 0.02 ? m.rgb : [255, 220, 170];
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * (1 + m.lit * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.join(',')},${a.toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(first);
    };
    // sendWave only reads refs
  }, []);

  return <canvas ref={canvas} width={W} height={H} aria-hidden="true" className="absolute inset-0 h-[1080px] w-[1920px]" />;
}
