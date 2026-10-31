import type { GameInfo } from '@shared/game';

// The one line about player count, shared by the TV and the phones:
// "2–8 players", or what's keeping the game from starting.
export function playersLine(game: GameInfo, count: number): { text: string; problem: boolean } {
  if (count < game.minPlayers) {
    const n = game.minPlayers - count;
    return { text: `Needs ${n} more player${n === 1 ? '' : 's'}`, problem: true };
  }
  if (count > game.maxPlayers)
    return { text: `${count} players at home. The maximum is ${game.maxPlayers}.`, problem: true };
  const range =
    game.minPlayers === game.maxPlayers ? `${game.minPlayers} players` : `${game.minPlayers}–${game.maxPlayers} players`;
  return { text: range, problem: false };
}
