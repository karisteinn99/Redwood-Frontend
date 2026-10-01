import type { ComponentType } from 'react';

import type { Player } from '@shared/party-types';

import { GoFishPhone } from './go-fish/phone';
import { GoFishTutorial } from './go-fish/tutorial';
import { GoFishTv } from './go-fish/tv';
import { LiarsDicePhone } from './liars-dice/phone';
import { LiarsDiceTutorial } from './liars-dice/tutorial';
import { LiarsDiceTv } from './liars-dice/tv';

// Kept separate from the server registry (games/index.ts) so React never
// ends up in the PartyKit worker bundle.
export interface GameUi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tv: ComponentType<{ view: any; players: Player[] }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Phone: ComponentType<{ view: any; players: Player[]; send: (action: any) => void }>;
  Tutorial?: ComponentType<{ onClose: () => void }>;
}

export const GAME_UI: Record<string, GameUi> = {
  'liars-dice': { Tv: LiarsDiceTv, Phone: LiarsDicePhone, Tutorial: LiarsDiceTutorial },
  'go-fish': { Tv: GoFishTv, Phone: GoFishPhone, Tutorial: GoFishTutorial },
};
