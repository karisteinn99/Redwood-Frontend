import { db } from './index';
import { questions } from './schema';

const initialQuestions = [
  {
    question: 'Where is the Eiffel Tower?',
    correctLat: 48.8584,
    correctLng: 2.2945,
    difficulty: 'easy',
    category: 'landmarks',
  },
  {
    question: 'Where is the Statue of Liberty?',
    correctLat: 40.6892,
    correctLng: -74.0445,
    difficulty: 'easy',
    category: 'landmarks',
  },
  {
    question: 'Where is Machu Picchu?',
    correctLat: -13.1631,
    correctLng: -72.545,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is the Great Wall of China (Badaling section)?',
    correctLat: 40.3584,
    correctLng: 116.02,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is Christ the Redeemer?',
    correctLat: -22.9519,
    correctLng: -43.2105,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is the Sydney Opera House?',
    correctLat: -33.8568,
    correctLng: 151.2153,
    difficulty: 'easy',
    category: 'landmarks',
  },
  {
    question: 'Where is Mount Everest?',
    correctLat: 27.9881,
    correctLng: 86.925,
    difficulty: 'hard',
    category: 'geography',
  },
  {
    question: 'Where is the Taj Mahal?',
    correctLat: 27.1751,
    correctLng: 78.0421,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is Big Ben?',
    correctLat: 51.4994,
    correctLng: -0.1245,
    difficulty: 'easy',
    category: 'landmarks',
  },
  {
    question: 'Where is the Colosseum?',
    correctLat: 41.8902,
    correctLng: 12.4922,
    difficulty: 'easy',
    category: 'landmarks',
  },
  {
    question: 'Where is Angkor Wat?',
    correctLat: 13.4125,
    correctLng: 103.867,
    difficulty: 'hard',
    category: 'landmarks',
  },
  {
    question: 'Where is the Pyramids of Giza?',
    correctLat: 29.9792,
    correctLng: 31.1342,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is Stonehenge?',
    correctLat: 51.1789,
    correctLng: -1.8262,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is the Golden Gate Bridge?',
    correctLat: 37.8199,
    correctLng: -122.4783,
    difficulty: 'easy',
    category: 'landmarks',
  },
  {
    question: 'Where is Petra?',
    correctLat: 30.3285,
    correctLng: 35.4444,
    difficulty: 'hard',
    category: 'landmarks',
  },
  {
    question: 'Where is the Kremlin?',
    correctLat: 55.752,
    correctLng: 37.6175,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is the CN Tower?',
    correctLat: 43.6426,
    correctLng: -79.3871,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is Mount Fuji?',
    correctLat: 35.3606,
    correctLng: 138.7274,
    difficulty: 'medium',
    category: 'geography',
  },
  {
    question: 'Where is the Space Needle?',
    correctLat: 47.6205,
    correctLng: -122.3493,
    difficulty: 'medium',
    category: 'landmarks',
  },
  {
    question: 'Where is Neuschwanstein Castle?',
    correctLat: 47.5576,
    correctLng: 10.7498,
    difficulty: 'hard',
    category: 'landmarks',
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Check if questions already exist
    const existingQuestions = await db.select().from(questions).limit(1);

    if (existingQuestions.length > 0) {
      console.log('⏭️  Database already seeded. Skipping...');
      return;
    }

    // Insert questions
    const insertedQuestions = await db
      .insert(questions)
      .values(initialQuestions)
      .returning();

    console.log(
      `✅ Successfully seeded ${insertedQuestions.length} questions!`
    );
    console.log('🎯 Ready to play!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🏁 Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
