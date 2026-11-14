import type { MiniId } from './definition';

// Each minigame's window colour (the only colour on Party night besides the
// players' own) and how it's explained on the TV and the phone.
export const MINI_INFO: Record<MiniId, { name: string; color: string; rules: string[]; phone: string }> = {
  'quick-tap': {
    name: 'Quick Tap',
    color: '#2f5fbf',
    rules: ['Your phone turns gold after a random wait.', 'Tap the moment it does. Three tries.', 'Too early counts as a slow tap.'],
    phone: 'Tap the moment your screen turns gold.',
  },
  versus: {
    name: 'Knockout',
    color: '#b2492f',
    rules: ['Which has more? Two answers, one is right.', 'Wrong and you’re knocked out.', 'If everyone’s wrong, everyone stays in.'],
    phone: 'Which has more? Wrong and you’re knocked out.',
  },
  'same-pick': {
    name: 'Same Pick',
    color: '#8a3fa8',
    rules: ['A question with four answers.', 'Pick what most of the room will pick.', 'Match the crowd to score. Three questions.'],
    phone: 'Pick what most of the room will pick.',
  },
};

export const placeLabel = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
