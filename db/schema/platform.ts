import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Rooms table - platform-level game rooms shared across all game types
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(),
  gameType: text('game_type').notNull().default('geography'),
  hostId: text('host_id'),
  status: text('status', { enum: ['waiting', 'playing', 'finished'] }).default(
    'waiting'
  ),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  roomId: serial('room_id').references(() => rooms.id),
  name: text('name').notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
