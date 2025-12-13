import { db } from '@/db';
import { questions } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/bulk-questions - Bulk import questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionsData } = body;

    if (!Array.isArray(questionsData)) {
      return NextResponse.json(
        { error: 'questionsData must be an array' },
        { status: 400 }
      );
    }

    // Validate all questions have required fields
    for (const q of questionsData) {
      if (!q.question || q.correctLat == null || q.correctLng == null) {
        return NextResponse.json(
          {
            error:
              'All questions must have question, correctLat, and correctLng fields',
          },
          { status: 400 }
        );
      }
    }

    // Insert all questions
    const insertedQuestions = await db
      .insert(questions)
      .values(
        questionsData.map((q) => ({
          question: q.question,
          correctLat: q.correctLat,
          correctLng: q.correctLng,
          difficulty: q.difficulty || 'medium',
          category: q.category || 'geography',
        }))
      )
      .returning();

    return NextResponse.json(
      {
        message: `Successfully imported ${insertedQuestions.length} questions`,
        questions: insertedQuestions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    );
  }
}

// GET /api/admin/bulk-questions - Get all questions for export
export async function GET() {
  try {
    const allQuestions = await db.select().from(questions);
    return NextResponse.json(allQuestions);
  } catch (error) {
    console.error('Error fetching all questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
