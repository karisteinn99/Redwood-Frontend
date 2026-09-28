import { networkInterfaces } from 'os';
import { NextResponse } from 'next/server';

// Dev only: lets a TV opened on localhost show a QR that phones can reach.
export function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ip: null }, { status: 404 });
  }
  const ip = Object.values(networkInterfaces())
    .flat()
    .find((i) => i?.family === 'IPv4' && !i.internal)?.address;
  return NextResponse.json({ ip: ip ?? null });
}
