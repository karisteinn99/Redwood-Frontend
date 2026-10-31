import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

const INK = '#211d18';
const EYE = '#2b2219';
const PAPER = '#f8f1e3';
const QUIET = 4;
const GLASS = '#dcbd7c'; // Home's gold

// Home's QR (see the design system's JoinCode): round dot modules, rounded
// finder eyes and a small arched window in the centre, like the room
// windows on the wall. Error correction H so the window (and the modules
// cleared under it) can't break scanning.
export function StyledQr({ value, className }: { value: string; className?: string }) {
  const { n, dots, door } = useMemo(() => {
    const qr = qrcode(0, 'H');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const doorW = n * 0.15;
    const doorH = doorW * 1.5;
    const door = { x: (n - doorW) / 2, y: (n - doorH) / 2, w: doorW, h: doorH };
    const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const underDoor = (r: number, c: number) =>
      c + 0.5 > door.x - doorW * 0.12 - 0.6 && c + 0.5 < door.x + door.w + doorW * 0.12 + 0.6 && r + 0.5 > door.y - 0.6 && r + 0.5 < door.y + door.h + 0.6;
    const dots: [number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (qr.isDark(r, c) && !inEye(r, c) && !underDoor(r, c)) dots.push([c + 0.5, r + 0.5]);
    return { n, dots, door };
  }, [value]);

  const eyes = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  const archR = door.w / 2;
  const inset = door.w * 0.14;
  const sillH = door.w * 0.16;
  const size = n + QUIET * 2;
  return (
    <svg viewBox={`${-QUIET} ${-QUIET} ${size} ${size}`} role="img" aria-label={`QR code to join: ${value}`} className={className}>
      <rect x={-QUIET} y={-QUIET} width={size} height={size} fill={PAPER} />
      <g fill={INK}>
        {dots.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r="0.43" />
        ))}
      </g>
      {eyes.map(([x, y]) => (
        <g key={`${x},${y}`} fill={EYE}>
          <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.2" fill="none" stroke={EYE} strokeWidth="1" />
          <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.6" />
        </g>
      ))}
      {/* the arched window: frame, warm lit glass, keystone and sill */}
      <path
        d={`M${door.x} ${door.y + door.h} V${door.y + archR} a${archR} ${archR} 0 0 1 ${door.w} 0 V${door.y + door.h} Z`}
        fill={EYE}
      />
      <path
        d={`M${door.x + inset} ${door.y + door.h - sillH} V${door.y + archR} a${archR - inset} ${archR - inset} 0 0 1 ${door.w - inset * 2} 0 V${door.y + door.h - sillH} Z`}
        fill={GLASS}
      />
      <path
        d={`M${door.x + archR - door.w * 0.09} ${door.y - door.w * 0.04} h${door.w * 0.18} l${-door.w * 0.035} ${door.w * 0.22} h${-door.w * 0.11} Z`}
        fill={EYE}
      />
      <rect
        x={door.x - door.w * 0.12}
        y={door.y + door.h - sillH}
        width={door.w * 1.24}
        height={sillH}
        rx={sillH * 0.3}
        fill={EYE}
      />
    </svg>
  );
}
