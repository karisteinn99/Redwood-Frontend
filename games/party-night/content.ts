// Question packs for Party night's minigames. Hand-written with the numbers
// in, so nothing depends on a live data source going stale or offline.

export interface VersusQuestion {
  prompt: string;
  a: { label: string; value: string };
  b: { label: string; value: string };
  answer: 'a' | 'b';
}

export const VERSUS: VersusQuestion[] = [
  { prompt: 'More people live in…', a: { label: 'Iceland', value: '≈ 390,000' }, b: { label: 'Malta', value: '≈ 540,000' }, answer: 'b' },
  { prompt: 'Which is taller?', a: { label: 'Kilimanjaro', value: '5,895 m' }, b: { label: 'Mont Blanc', value: '4,806 m' }, answer: 'a' },
  { prompt: 'Which is older?', a: { label: 'Oxford University', value: 'teaching by 1096' }, b: { label: 'The Aztec city Tenochtitlan', value: 'founded 1325' }, answer: 'a' },
  { prompt: 'Which runs faster?', a: { label: 'Ostrich', value: '≈ 70 km/h' }, b: { label: 'Cheetah', value: '≈ 110 km/h' }, answer: 'b' },
  { prompt: 'Which has more countries?', a: { label: 'Africa', value: '54' }, b: { label: 'Asia', value: '≈ 48' }, answer: 'a' },
  { prompt: 'Which has more bones?', a: { label: 'An adult', value: '206' }, b: { label: 'A newborn baby', value: '≈ 300' }, answer: 'b' },
  { prompt: 'Which planet is hotter?', a: { label: 'Mercury', value: '≈ 167 °C average' }, b: { label: 'Venus', value: '≈ 464 °C average' }, answer: 'b' },
  { prompt: 'Which has more legs?', a: { label: 'A spider', value: '8' }, b: { label: 'A lobster', value: '10' }, answer: 'b' },
  { prompt: 'Which came out first?', a: { label: 'Tetris', value: '1984' }, b: { label: 'Super Mario Bros.', value: '1985' }, answer: 'a' },
  { prompt: 'Which is taller?', a: { label: 'Burj Khalifa', value: '828 m' }, b: { label: 'Two Eiffel Towers stacked', value: '660 m' }, answer: 'a' },
  { prompt: 'Which is bigger?', a: { label: 'Pluto', value: '2,377 km across' }, b: { label: 'Our Moon', value: '3,474 km across' }, answer: 'b' },
  { prompt: 'Which spans more time zones?', a: { label: 'Russia', value: '11' }, b: { label: 'France', value: '12, with its overseas lands' }, answer: 'b' },
  { prompt: 'Which lake is deeper?', a: { label: 'Lake Baikal', value: '1,642 m' }, b: { label: 'Lake Tanganyika', value: '1,470 m' }, answer: 'a' },
  { prompt: 'Which happened first, in 1969?', a: { label: 'Woodstock', value: 'August 15' }, b: { label: 'The first Moon landing', value: 'July 20' }, answer: 'b' },
  { prompt: 'More people live in…', a: { label: 'Reykjavík', value: '≈ 140,000' }, b: { label: 'The Faroe Islands', value: '≈ 55,000' }, answer: 'a' },
  { prompt: 'Which is bigger?', a: { label: 'Greenland', value: '2.17 million km²' }, b: { label: 'Mexico', value: '1.96 million km²' }, answer: 'a' },
  { prompt: 'More people live in…', a: { label: 'Greater Tokyo', value: '≈ 37 million' }, b: { label: 'Canada', value: '≈ 40 million' }, answer: 'b' },
  { prompt: 'Which has more strings?', a: { label: 'A banjo', value: 'usually 5' }, b: { label: 'A guitar', value: 'usually 6' }, answer: 'b' },
];

export interface PickPrompt {
  prompt: string;
  options: [string, string, string, string];
}

export const PICKS: PickPrompt[] = [
  { prompt: 'Best pizza topping?', options: ['Pepperoni', 'Mushrooms', 'Pineapple', 'Just cheese'] },
  { prompt: 'Best time of day?', options: ['Morning', 'Afternoon', 'Evening', 'Late night'] },
  { prompt: 'Pick a number', options: ['1', '3', '7', '10'] },
  { prompt: 'Best season?', options: ['Spring', 'Summer', 'Autumn', 'Winter'] },
  { prompt: 'Pick a colour', options: ['Red', 'Blue', 'Green', 'Yellow'] },
  { prompt: 'Best superpower?', options: ['Flying', 'Invisibility', 'Reading minds', 'Teleporting'] },
  { prompt: 'Best movie snack?', options: ['Popcorn', 'Nachos', 'Candy', 'Nothing'] },
  { prompt: 'Best pet?', options: ['Dog', 'Cat', 'Fish', 'No pets'] },
  { prompt: 'Dream holiday?', options: ['Beach', 'Big city', 'Mountains', 'Stay home'] },
  { prompt: 'Best breakfast?', options: ['Eggs', 'Cereal', 'Toast', 'Skip it'] },
];
