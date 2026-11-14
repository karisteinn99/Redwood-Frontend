import type { GameDefinition, GameInfo } from '@shared/game';

import { goFishGame } from './go-fish/definition';
import { liarsDiceGame } from './liars-dice/definition';
import { partyNightGame } from './party-night/definition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: Record<string, GameDefinition<any, any, any>> = {
  [liarsDiceGame.id]: liarsDiceGame,
  [goFishGame.id]: goFishGame,
  [partyNightGame.id]: partyNightGame,
};

export function gameInfos(): GameInfo[] {
  return Object.values(GAMES).map(({ id, name, minPlayers, maxPlayers }) => ({
    id,
    name,
    minPlayers,
    maxPlayers,
  }));
}
