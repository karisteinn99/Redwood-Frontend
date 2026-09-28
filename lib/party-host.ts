// Shared PartyKit host resolution — used both by the realtime socket
// (use-party-room.ts) and one-off HTTP checks against a room (e.g. "is this
// code already taken?", in app/page.tsx).
export const partyHost = () =>
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? `${window.location.hostname}:1999`;

export const partyRoomUrl = (room: string) => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://${partyHost()}/parties/main/${room}`;
};
