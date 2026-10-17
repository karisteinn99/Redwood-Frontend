'use client';

import { useEffect, useRef } from 'react';

// "gohome" with the h as a lit candle, and "games" between brass hairlines
// (see the design system's Logo). Styles are the .logo-* classes in
// globals.css; this component only places the candle parts.
export function HomeLogo() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const el = root.current;
    if (!el) return;
    const word = el.querySelector<HTMLElement>('.logo-word')!;
    const h = el.querySelector<HTMLElement>('.logo-h')!;
    const games = el.querySelector<HTMLElement>('.logo-games')!;
    const cs = getComputedStyle(word);
    // Only the real face: asking the loader for next/font's local fallback
    // face as well rejects with a network error.
    const spec = `${cs.fontWeight} 400px ${cs.fontFamily.split(',')[0]}`;
    document.fonts
      .load(spec)
      .catch(() => {})
      .then(() => {
        if (!cancelled) placeCandle(spec, word, h, games);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={root} className="logo" aria-label="Go Home Games" role="img">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <radialGradient id="logoFO" cx="0.5" cy="0.7" r="0.6">
            <stop offset="0" stopColor="#ffd27a" />
            <stop offset="0.55" stopColor="#f0973c" />
            <stop offset="1" stopColor="#d97a3f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="logoFC" cx="0.5" cy="0.65" r="0.55">
            <stop offset="0" stopColor="#fffdf2" />
            <stop offset="0.7" stopColor="#ffeaa6" />
            <stop offset="1" stopColor="#ffeaa6" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <span className="logo-word" aria-hidden="true">
        go
        <span className="logo-h">
          h<i className="logo-pool" />
          <i className="logo-wax logo-wax1" />
          <i className="logo-wax logo-wax2" />
          <i className="logo-wick" />
          <i className="logo-flame">
            <svg viewBox="0 0 30 58">
              <path d="M15 0 C22 16 28 26 28 38 A13 13 0 0 1 2 38 C2 26 8 16 15 0Z" fill="url(#logoFO)" />
              <path d="M15 26 C19 33 21 38 21 44 A6 6 0 0 1 9 44 C9 38 11 33 15 26Z" fill="url(#logoFC)" />
            </svg>
          </i>
        </span>
        ome
      </span>
      <span className="logo-games" aria-hidden="true">
        <i />
        <span>games</span>
        <i />
      </span>
    </div>
  );
}

// Measures the font's real h and g on a canvas, so the flame sits on the
// stem, the wax pools on its tip and the "games" line starts after the g,
// whatever the typeface renders as.
function placeCandle(spec: string, word: HTMLElement, h: HTMLElement, games: HTMLElement) {
  const W = 700, H = 760, BASE = 560, X = 100;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  if (!x) return;
  x.font = spec;
  x.textBaseline = 'alphabetic';
  const mh = x.measureText('h');
  const mg = x.measureText('g');
  const A = mh.fontBoundingBoxAscent;
  const D = mh.fontBoundingBoxDescent;
  x.fillText('h', X, BASE);
  const d = x.getImageData(0, 0, W, H).data;
  const on = (px: number, py: number) => d[(py * W + px) * 4 + 3] > 128;

  let top = H;
  for (let py = 0; py < H && top === H; py++)
    for (let px = 0; px < W; px++)
      if (on(px, py)) {
        top = py;
        break;
      }
  const row = top + 70;
  let s0 = -1, s1 = -1;
  for (let qx = 0; qx < W; qx++) {
    if (on(qx, row) && s0 < 0) s0 = qx;
    if (!on(qx, row) && s0 >= 0) {
      s1 = qx;
      break;
    }
  }
  const topAt = (qx: number) => {
    let qy = 0;
    while (qy < H && !on(Math.round(qx), qy)) qy++;
    return qy;
  };
  const em = (v: number) => `${(v / 400).toFixed(4)}em`;
  const sl = s0 - X, sr = s1 - X, sw = sr - sl, mid = (sl + sr) / 2;
  const tMid = topAt(X + mid), tL = topAt(X + sl + sw * 0.15), tR = topAt(X + sr - sw * 0.15);
  const fromTop = (py: number) => A - (BASE - py);
  const lift = 26;
  const st = h.style;
  st.setProperty('--fl-l', em(mid - 21));
  st.setProperty('--fl-t', em(fromTop(tMid) - 70 - lift));
  st.setProperty('--wk-l', em(mid - 1.6));
  st.setProperty('--wk-t', em(fromTop(tMid) - lift - 6));
  st.setProperty('--wk-h', em(lift + 4));
  st.setProperty('--pl-l', em(sl + 1));
  st.setProperty('--pl-w', em(sw - 2));
  st.setProperty('--pl-t', em(fromTop(tMid) - 6));
  st.setProperty('--pl-r', `${((-Math.atan2(tL - tR, sw * 0.7) * 180) / Math.PI).toFixed(1)}deg`);
  const dw = Math.max(8, sw * 0.22);
  st.setProperty('--wx-w', em(dw));
  st.setProperty('--w1-l', em(sl + 2));
  st.setProperty('--w1-t', em(fromTop(tL) + 2));
  st.setProperty('--w2-l', em(sr - dw - 4));
  st.setProperty('--w2-t', em(fromTop(tR)));
  h.classList.add('logo-lit');

  const size = parseFloat(getComputedStyle(word).fontSize);
  const k = size / 400;
  const baseline = (size - (A + D) * k) / 2 + A * k;
  const gBottom = baseline + mg.actualBoundingBoxDescent * k;
  games.style.marginLeft = `${(mg.width * k + size * 0.1).toFixed(1)}px`;
  games.style.marginTop = `${(gBottom - size - games.offsetHeight / 2).toFixed(1)}px`;
}
