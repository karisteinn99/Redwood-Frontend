import type { ComponentType } from 'react';

import type { Player } from '@shared/party-types';

import { GoFishPhone } from './go-fish/phone';
import { GoFishTutorial } from './go-fish/tutorial';
import { GoFishTv } from './go-fish/tv';
import { LiarsDicePhone } from './liars-dice/phone';
import { LiarsDiceTutorial } from './liars-dice/tutorial';
import { LiarsDiceTv } from './liars-dice/tv';
import { PartyNightPhone } from './party-night/phone';
import { PartyNightTv } from './party-night/tv';
import type { RulesTheme } from './rules-sheet';

// Kept separate from the server registry (games/index.ts) so React never
// ends up in the PartyKit worker bundle.
export interface GameUi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tv: ComponentType<{ view: any; players: Player[] }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Phone: ComponentType<{ view: any; players: Player[]; send: (action: any) => void }>;
  // theme 'home' puts the rules on Home's wood, for reading them before a game.
  Tutorial?: ComponentType<{ onClose: () => void; theme?: RulesTheme }>;
  // One line under the game's name on the phone's game page at Home.
  blurb?: string;
  // Rough length of a whole game, shown on the game page and TV Up next.
  playTime?: string;
  // The game in three short lines for the TV's Up next screen: [heading, line].
  tvRules?: [string, string][];
}

export const GAME_UI: Record<string, GameUi> = {
  'liars-dice': {
    Tv: LiarsDiceTv,
    Phone: LiarsDicePhone,
    Tutorial: LiarsDiceTutorial,
    blurb: 'Bid on everyone’s hidden dice, or call a liar.',
    playTime: '15–20 min',
    tvRules: [
      ['Your dice are secret', 'Everyone rolls five. Only you see yours.'],
      ['Bid on the whole table', '“Three fours” means at least three among everyone’s dice. 1s are wild.'],
      ['Raise, or call Liar!', 'Wrong side of the call loses a die. Last one with dice wins.'],
    ],
  },
  'go-fish': {
    Tv: GoFishTv,
    Phone: GoFishPhone,
    Tutorial: GoFishTutorial,
    blurb: 'Ask for cards, and make books of four.',
    playTime: '10–15 min',
    tvRules: [
      ['Ask someone for a rank', 'You must already hold one. “Got any sevens?”'],
      ['They hand them over, or Go Fish', 'Draw from the pond. Got what you asked for? Go again.'],
      ['Four of a kind is a book', 'When the cards run out, most books wins.'],
    ],
  },
  'party-night': {
    Tv: PartyNightTv,
    Phone: PartyNightPhone,
    blurb: 'Quick minigames back to back. Race to the pickle.',
    playTime: '20–30 min',
    tvRules: [
      ['Short minigames, one after another', 'Tapping, guessing, reading the room. About a minute each.'],
      ['Your place earns points', '1st gets 3, 2nd gets 2, 3rd gets 1. Reach 15 for a pickle.'],
      ['First to two pickles wins', 'Past the line, the last places lose points. The host can change all this.'],
    ],
  },
};
