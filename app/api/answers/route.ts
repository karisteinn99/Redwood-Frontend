import { calculateDistance, db } from '@/db';
import { answers, gameSessions, questions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/answers - Submit answer and get distance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answer, sessionId } = body;

    if (!questionId || !answer || !answer.lat || !answer.lng) {
      return NextResponse.json(
        {
          error: 'Missing required fields: questionId, answer.lat, answer.lng',
        },
        { status: 400 }
      );
    }

    // Get the correct answer for the question
    const question = await db
      .select({
        correctLat: questions.correctLat,
        correctLng: questions.correctLng,
      })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const { correctLat, correctLng } = question[0];

    // Calculate distance between answer and correct location
    const distanceKm = calculateDistance(
      answer.lat,
      answer.lng,
      correctLat,
      correctLng
    );

    // Store the answer if sessionId provided
    if (sessionId) {
      await db.insert(answers).values({
        sessionId,
        questionId,
        answerLat: answer.lat,
        answerLng: answer.lng,
        distanceKm,
      });

      // Update session total score
      const session = await db
        .select({
          totalScore: gameSessions.totalScore,
          questionsAnswered: gameSessions.questionsAnswered,
        })
        .from(gameSessions)
        .where(eq(gameSessions.id, sessionId))
        .limit(1);

      if (session.length > 0) {
        await db
          .update(gameSessions)
          .set({
            totalScore: (session[0].totalScore || 0) + distanceKm,
            questionsAnswered: (session[0].questionsAnswered || 0) + 1,
          })
          .where(eq(gameSessions.id, sessionId));
      }
    }

    return NextResponse.json({
      distance_km: distanceKm,
      correct_location: { lat: correctLat, lng: correctLng },
    });
  } catch (error) {
    console.error('Error processing answer:', error);
    return NextResponse.json(
      { error: 'Failed to process answer' },
      { status: 500 }
    );
  }
}
