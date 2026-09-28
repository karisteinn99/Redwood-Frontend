import type { GameDefinition, GameInfo } from '@shared/game';

import { demoGame } from './demo/definition';
import { liarsDiceGame } from './liars-dice/definition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: Record<string, GameDefinition<any, any, any>> = {
  [liarsDiceGame.id]: liarsDiceGame,
  [demoGame.id]: demoGame, // kept as a minimal test fixture for the platform layer
};

export function gameInfos(): GameInfo[] {
  return Object.values(GAMES).map(({ id, name, minPlayers, maxPlayers }) => ({
    id,
    name,
    minPlayers,
    maxPlayers,
  }));
}
