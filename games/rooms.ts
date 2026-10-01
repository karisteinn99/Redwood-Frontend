// Home-TV-only door metadata — kept separate from games/ui.tsx (which the
// join page also imports) so the join page never needs to know about doors.
export interface RoomDoor {
  gameId: string;
  label: string;
}

// Left-to-right order of Home's live doors. Go Fish takes the Lounge's old
// (leftmost) slot; Liar's Dice keeps its slot. The still-decorative locked
// door isn't listed here — it stays a separate trailing element in
// home-tv.tsx until a third room actually exists.
export const ROOM_DOORS: RoomDoor[] = [
  { gameId: 'go-fish', label: 'Go Fish' },
  { gameId: 'liars-dice', label: "Liar's Game" },
];
