import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

const INK = '#211d18';
const EYE = '#2a2452';
const PAPER = '#f8f1e3';
const QUIET = 4;

// Home's QR (see the design system's JoinCode): round dot modules, rounded
// finder eyes and a small door in the centre. Error correction H so the door
// (and the modules cleared under it) can't break scanning.
export function StyledQr({ value, className }: { value: string; className?: string }) {
  const { n, dots, door } = useMemo(() => {
    const qr = qrcode(0, 'H');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const doorW = n * 0.15;
    const doorH = doorW * 1.4;
    const door = { x: (n - doorW) / 2, y: (n - doorH) / 2, w: doorW, h: doorH };
    const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const underDoor = (r: number, c: number) =>
      c + 0.5 > door.x - 0.6 && c + 0.5 < door.x + door.w + 0.6 && r + 0.5 > door.y - 0.6 && r + 0.5 < door.y + door.h + 0.6;
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
      <path
        d={`M${door.x} ${door.y + door.h} V${door.y + archR} a${archR} ${archR} 0 0 1 ${door.w} 0 V${door.y + door.h} Z`}
        fill={EYE}
      />
      <circle cx={door.x + door.w * 0.78} cy={door.y + door.h * 0.58} r={door.w * 0.07} fill={PAPER} />
    </svg>
  );
}
