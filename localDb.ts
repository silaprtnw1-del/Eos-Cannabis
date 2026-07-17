import { eq } from 'drizzle-orm';
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

// Initialize Expo SQLite instance
const sqlite = openDatabaseSync('apn_local.db');

// Initialize Drizzle ORM wrapper
export const localDb = drizzle(sqlite);

// Define local_cultivation_logs schema
export const localCultivationLogs = sqliteTable('local_cultivation_logs', {
  id: text('id').primaryKey(),
  batchid: text('batchid').notNull(),
  roomname: text('roomname').notNull(),
  watervolume: real('watervolume').notNull(),
  waterunit: text('waterunit').notNull(),
  phin: real('phin').notNull(),
  ecin: real('ecin').notNull(),
  runoffvolume: real('runoffvolume'),
  phout: real('phout'),
  ecout: real('ecout'),
  nutrientsfeed: text('nutrientsfeed').notNull(), // stored as stringified JSON
  operatorid: text('operatorid').notNull(),
  notes: text('notes'),
  synced: integer('synced', { mode: 'boolean' }).default(false).notNull(),
  logdate: text('logdate').notNull()
});

// Define local_gacp_checklists schema
export const localGacpChecklists = sqliteTable('local_gacp_checklists', {
  id: text('id').primaryKey(),
  checkdate: text('checkdate').notNull(),
  operatorid: text('operatorid').notNull(),
  tasks: text('tasks').notNull(), // stored as stringified JSON
  haspestincident: integer('haspestincident', { mode: 'boolean' }).notNull(),
  incidentdetails: text('incidentdetails'),
  correctiveaction: text('correctiveaction'),
  synced: integer('synced', { mode: 'boolean' }).default(false).notNull()
});

// Synchronous database table builder (runs at application startup)
export const initLocalDb = () => {
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS local_cultivation_logs (
      id TEXT PRIMARY KEY,
      batchid TEXT NOT NULL,
      roomname TEXT NOT NULL,
      watervolume REAL NOT NULL,
      waterunit TEXT NOT NULL,
      phin REAL NOT NULL,
      ecin REAL NOT NULL,
      runoffvolume REAL,
      phout REAL,
      ecout REAL,
      nutrientsfeed TEXT NOT NULL,
      operatorid TEXT NOT NULL,
      notes TEXT,
      synced INTEGER DEFAULT 0 NOT NULL,
      logdate TEXT NOT NULL
    );
  `);
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS local_gacp_checklists (
      id TEXT PRIMARY KEY,
      checkdate TEXT NOT NULL,
      operatorid TEXT NOT NULL,
      tasks TEXT NOT NULL,
      haspestincident INTEGER DEFAULT 0 NOT NULL,
      incidentdetails TEXT,
      correctiveaction TEXT,
      synced INTEGER DEFAULT 0 NOT NULL
    );
  `);
};

export const genLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export type LocalCultivationLog = typeof localCultivationLogs.$inferSelect;
export type LocalGacpChecklist = typeof localGacpChecklists.$inferSelect;

export const insertLocalCultivationLog = (row: typeof localCultivationLogs.$inferInsert) =>
  localDb.insert(localCultivationLogs).values(row);

export const insertLocalGacpChecklist = (row: typeof localGacpChecklists.$inferInsert) =>
  localDb.insert(localGacpChecklists).values(row);

export const getUnsyncedCultivationLogs = () =>
  localDb
    .select()
    .from(localCultivationLogs)
    .where(eq(localCultivationLogs.synced, false))
    .orderBy(localCultivationLogs.id);

export const getUnsyncedGacpChecklists = () =>
  localDb
    .select()
    .from(localGacpChecklists)
    .where(eq(localGacpChecklists.synced, false))
    .orderBy(localGacpChecklists.id);

export const deleteLocalCultivationLog = (id: string) =>
  localDb.delete(localCultivationLogs).where(eq(localCultivationLogs.id, id));

export const deleteLocalGacpChecklist = (id: string) =>
  localDb.delete(localGacpChecklists).where(eq(localGacpChecklists.id, id));

export const countPendingSync = async () => {
  const [logs, checklists] = await Promise.all([
    getUnsyncedCultivationLogs(),
    getUnsyncedGacpChecklists(),
  ]);
  return logs.length + checklists.length;
};
