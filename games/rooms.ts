// Home-TV-only window metadata — kept separate from games/ui.tsx (which the
// join page also imports) so the join page never needs to know about windows.
export interface RoomDoor {
  gameId: string;
  label: string;
  // Which painting shows through the window (app/components/home/home-windows.ts).
  pane: 'dock' | 'ship';
  // The room's colour: the window title's gradient, top to bottom, and the
  // colour its wave lights the motes in.
  title: [string, string, string];
  wave: [number, number, number];
}

// Left-to-right order of Home's room windows. The window still being built
// isn't listed here — it stays a separate trailing element in home-tv.tsx
// until a third room actually exists.
export const ROOM_DOORS: RoomDoor[] = [
  { gameId: 'go-fish', label: 'Go Fish', pane: 'dock', title: ['#ffe3d3', '#ffb08d', '#e9774d'], wave: [255, 138, 92] },
  { gameId: 'liars-dice', label: 'Liar’s Game', pane: 'ship', title: ['#d6faf0', '#86ead2', '#3cbf9f'], wave: [77, 232, 194] },
];
