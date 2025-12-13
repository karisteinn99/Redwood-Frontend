import { db } from '@/db';
import { gameSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/game-sessions - Get leaderboard or session details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const leaderboard = searchParams.get('leaderboard');

    if (sessionId) {
      // Get specific session details
      const session = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.id, parseInt(sessionId)))
        .limit(1);

      if (session.length === 0) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(session[0]);
    }

    if (leaderboard === 'true') {
      // Get top sessions for leaderboard
      const topSessions = await db
        .select({
          playerName: gameSessions.playerName,
          totalScore: gameSessions.totalScore,
          questionsAnswered: gameSessions.questionsAnswered,
          completedAt: gameSessions.completedAt,
        })
        .from(gameSessions)
        .where(eq(gameSessions.isCompleted, true))
        .orderBy(gameSessions.totalScore) // Lower score is better
        .limit(10);

      return NextResponse.json(topSessions);
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game sessions' },
      { status: 500 }
    );
  }
}

// POST /api/game-sessions - Create new game session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName } = body;

    const newSession = await db
      .insert(gameSessions)
      .values({
        playerName: playerName || 'Anonymous Player',
      })
      .returning();

    return NextResponse.json(newSession[0], { status: 201 });
  } catch (error) {
    console.error('Error creating game session:', error);
    return NextResponse.json(
      { error: 'Failed to create game session' },
      { status: 500 }
    );
  }
}

// PATCH /api/game-sessions - Update game session (mark complete)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, isCompleted } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const updateData: any = {};
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }

    const updatedSession = await db
      .update(gameSessions)
      .set(updateData)
      .where(eq(gameSessions.id, sessionId))
      .returning();

    if (updatedSession.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSession[0]);
  } catch (error) {
    console.error('Error updating game session:', error);
    return NextResponse.json(
      { error: 'Failed to update game session' },
      { status: 500 }
    );
  }
}
