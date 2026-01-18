import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { db } from './index';
import type { NewQuestion } from './schema';
import { questions } from './schema';

const testQuestions: NewQuestion[] = [
  {
    question: 'Where is the Eiffel Tower located?',
    correctLat: 48.8584,
    correctLng: 2.2945,
    difficulty: 'easy' as const,
    category: 'landmarks',
  },
  {
    question: 'Where is the Statue of Liberty?',
    correctLat: 40.6892,
    correctLng: -74.0445,
    difficulty: 'easy' as const,
    category: 'landmarks',
  },
  {
    question: 'Where was Julius Caesar assassinated?',
    correctLat: 41.8919,
    correctLng: 12.4851,
    difficulty: 'hard' as const,
    category: 'history',
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test questions...');

    // Clear existing questions
    await db.delete(questions);

    // Insert new questions
    await db.insert(questions).values(testQuestions);

    console.log('✅ Database seeded successfully!');
    console.log(`📝 Added ${testQuestions.length} test questions`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
