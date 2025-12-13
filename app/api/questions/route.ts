import { db } from '@/db';
import { questions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/questions - Fetch random questions for game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get random questions from database
    const randomQuestions = await db
      .select({
        id: questions.id,
        question: questions.question,
      })
      .from(questions)
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    return NextResponse.json(randomQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create new question (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, correctLat, correctLng, difficulty, category } = body;

    if (!question || correctLat == null || correctLng == null) {
      return NextResponse.json(
        { error: 'Missing required fields: question, correctLat, correctLng' },
        { status: 400 }
      );
    }

    const newQuestion = await db
      .insert(questions)
      .values({
        question,
        correctLat,
        correctLng,
        difficulty: difficulty || 'medium',
        category: category || 'geography',
      })
      .returning();

    return NextResponse.json(newQuestion[0], { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
