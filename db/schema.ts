import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Questions table - stores geography questions with correct coordinates
export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  correctLat: real('correct_lat').notNull(),
  correctLng: real('correct_lng').notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).default(
    'medium'
  ),
  category: text('category').default('geography'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

// Game sessions table - tracks individual game sessions
export const gameSessions = sqliteTable('game_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerName: text('player_name'),
  totalScore: real('total_score').default(0), // Total distance in km
  questionsAnswered: integer('questions_answered').default(0),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Answers table - stores individual question answers and their scores
export const answers = sqliteTable('answers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .references(() => gameSessions.id)
    .notNull(),
  questionId: integer('question_id')
    .references(() => questions.id)
    .notNull(),
  answerLat: real('answer_lat').notNull(),
  answerLng: real('answer_lng').notNull(),
  distanceKm: real('distance_km').notNull(),
  answeredAt: integer('answered_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

// Admin users table - simple admin authentication
export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  hashedPassword: text('hashed_password').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

// Types for TypeScript
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
