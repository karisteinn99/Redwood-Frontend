// Home's room windows (see the design system's RoomWindow). Static SVG
// drawn by us, so the pane paintings are plain markup strings; PID is
// replaced with a per-window id so gradient ids never collide.

export interface Pane {
  live: boolean;
  bloom?: [string, string];
  rim?: string;
  body: string;
}

export const PANES: Record<'dock' | 'ship' | 'building', Pane> = {
  dock: {
    live: true,
    bloom: ['#ffd2b8', '#ff8a5c'],
    rim: '#ffb08a',
    body:
      '<defs><linearGradient id="PID-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1d2350"/><stop offset="0.55" stop-color="#6b3f6e"/><stop offset="1" stop-color="#e8875a"/></linearGradient></defs>' +
      '<rect x="0" y="0" width="176" height="170" fill="url(#PID-sky)"/><circle cx="118" cy="170" r="30" fill="#ffd27f"/>' +
      '<path d="M0 160 q30 -10 60 -2 t60 -4 t60 2 V172 H0Z" fill="#141a33"/><rect x="0" y="170" width="176" height="90" fill="#12324a"/>' +
      '<path d="M102 182 h32 M107 195 h22 M112 208 h12" stroke="#ffd27f" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M20 196 h40 M96 212 h50 M36 232 h34" stroke="#f6eee3" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>',
  },
  ship: {
    live: true,
    bloom: ['#c8fff0', '#4de8c2'],
    rim: '#9ff5dd',
    body:
      '<defs><radialGradient id="PID-sea" cx="0.65" cy="0.35" r="0.7"><stop offset="0" stop-color="#1c6a55"/><stop offset="0.5" stop-color="#0f2a22"/><stop offset="1" stop-color="#0a1210"/></radialGradient></defs>' +
      '<rect x="0" y="0" width="176" height="260" fill="url(#PID-sea)"/>' +
      '<path d="M-10 0 C30 60 30 200 -10 260 L18 260 C52 200 52 60 18 0Z" fill="#3a2a1a"/><path d="M186 0 C146 60 146 200 186 260 L158 260 C124 200 124 60 158 0Z" fill="#3a2a1a"/>' +
      '<circle cx="112" cy="92" r="24" fill="none" stroke="#8a6a3c" stroke-width="5"/><circle cx="112" cy="92" r="19" fill="#4de8c2" opacity="0.28"/>' +
      '<path d="M76 30 V60" stroke="#4a3a24" stroke-width="2"/><circle cx="76" cy="68" r="9" fill="#e8a33d"/><circle cx="76" cy="68" r="22" fill="#e8a33d" opacity="0.18"/>',
  },
  // A room still being built: curtains tied back, a stepladder inside.
  building: {
    live: false,
    body:
      '<defs><radialGradient id="PID-room" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#f6c77c"/><stop offset="0.6" stop-color="#c98f4e"/><stop offset="1" stop-color="#6e4a2a"/></radialGradient>' +
      '<linearGradient id="PID-m" x1="0" x2="1"><stop offset="0" stop-color="#2f4a38"/><stop offset="0.3" stop-color="#4c6e55"/><stop offset="0.55" stop-color="#34513f"/><stop offset="0.8" stop-color="#55795d"/><stop offset="1" stop-color="#2f4a38"/></linearGradient></defs>' +
      '<rect width="176" height="260" fill="url(#PID-room)"/>' +
      '<path d="M72 250 L96 132 L120 250 M80 212 H112 M86 182 H106 M91 156 H101" fill="none" stroke="#5a3b22" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M126 236 h22 v18 h-22 z" fill="#5a3b22"/><path d="M126 236 q11 -6 22 0" fill="#7a5532"/><rect x="0" y="246" width="176" height="14" fill="#8a6640"/>' +
      '<path d="M0 54 H58 C56 100 34 150 30 172 C40 200 48 230 40 260 H0 Z" fill="url(#PID-m)"/>' +
      '<path d="M176 54 H118 C120 100 142 150 146 172 C136 200 128 230 136 260 H176 Z" fill="url(#PID-m)"/>' +
      '<path d="M22 166 q14 6 18 16" fill="none" stroke="#d9b56c" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="168" r="4" fill="#d9b56c"/>' +
      '<path d="M154 166 q-14 6 -18 16" fill="none" stroke="#d9b56c" stroke-width="4" stroke-linecap="round"/><circle cx="154" cy="168" r="4" fill="#d9b56c"/>' +
      '<rect x="0" y="48" width="176" height="6" rx="3" fill="#b8955a"/>' +
      '<g fill="#d9b56c"><circle cx="10" cy="51" r="3.4"/><circle cx="26" cy="51" r="3.4"/><circle cx="42" cy="51" r="3.4"/><circle cx="134" cy="51" r="3.4"/><circle cx="150" cy="51" r="3.4"/><circle cx="166" cy="51" r="3.4"/></g>',
  },
};

const OPENING = 'M14 260 V88 a74 74 0 0 1 148 0 V260 Z';
const EDGE = 'M14 260 V88 a74 74 0 0 1 148 0 V260';

// The keystone arch: a brass arch, a darker line just inside it, a keystone
// spanning both, and a sill on two brackets. Clear glass, no bars.
export function windowMarkup(pane: Pane, id: string) {
  const rim = pane.rim ?? '#e9d2a6';
  const bloom =
    pane.live && pane.bloom
      ? `<radialGradient id="${id}-bloom" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="${pane.bloom[0]}" stop-opacity="0.9"/><stop offset="0.45" stop-color="${pane.bloom[1]}" stop-opacity="0.45"/><stop offset="1" stop-color="${pane.bloom[1]}" stop-opacity="0"/></radialGradient>` +
        `<rect x="0" y="0" width="176" height="260" fill="url(#${id}-bloom)" class="home-pane-light"/>`
      : '';
  return (
    `<defs><clipPath id="${id}-clip"><path d="${OPENING}"/></clipPath></defs>` +
    `<g clip-path="url(#${id}-clip)">${pane.body.split('PID').join(id)}${bloom}</g>` +
    `<path d="${EDGE}" fill="none" stroke="#b8955a" stroke-width="3.2"/>` +
    `<path d="M22 260 V88 a66 66 0 0 1 132 0 V260" fill="none" stroke="#7d6640" stroke-width="1.6"/>` +
    `<path class="home-rim" d="${EDGE}" fill="none" stroke="${rim}" stroke-width="5"/>` +
    `<path d="M79 9 h18 l-3.5 22 h-11 z" fill="#c9a35c" stroke="#7a5f32" stroke-width="1"/><path d="M81.5 11 h13" stroke="#ead08f" stroke-width="1" opacity="0.7"/>` +
    `<rect x="0" y="252" width="176" height="10" rx="2" fill="#7a5f3c"/><path d="M18 262 h14 l-7 12 z M144 262 h14 l-7 12 z" fill="#6e5a3a"/>`
  );
}
