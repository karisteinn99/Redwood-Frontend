import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Questions table - stores geography questions with correct coordinates
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  correctLat: real('correct_lat').notNull(),
  correctLng: real('correct_lng').notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).default(
    'medium'
  ),
  category: text('category').default('geography'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Game sessions table - tracks individual game sessions
export const gameSessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  playerName: text('player_name'),
  totalScore: real('total_score').default(0), // Total distance in km
  questionsAnswered: integer('questions_answered').default(0),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Answers table - stores individual question answers and their scores
export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => gameSessions.id)
    .notNull(),
  questionId: integer('question_id')
    .references(() => questions.id)
    .notNull(),
  answerLat: real('answer_lat').notNull(),
  answerLng: real('answer_lng').notNull(),
  distanceKm: real('distance_km').notNull(),
  answeredAt: timestamp('answered_at').defaultNow(),
});

// Admin users table - simple admin authentication
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  hashedPassword: text('hashed_password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types for TypeScript
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
