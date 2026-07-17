import { pgTable, uuid, text, boolean, timestamp, pgEnum, doublePrecision, integer, jsonb } from 'drizzle-orm/pg-core';

// 1. Enums
export const roleTypeEnum = pgEnum('role_type', ['OPERATOR', 'SUPERVISOR', 'AUDITOR', 'ADMIN']);
export const plantStageEnum = pgEnum('plant_stage', ['CLONE', 'VEG', 'FLOWER', 'HARVESTED', 'ARCHIVED']);
export const batchStatusEnum = pgEnum('batch_status', ['ACTIVE', 'COMPLETED', 'ARCHIVED']);
export const roomTypeEnum = pgEnum('room_type', ['CLONING', 'VEG', 'FLOWER', 'DRYING', 'CURING', 'PACKAGING']);
export const motherStatusEnum = pgEnum('mother_status', ['ACTIVE', 'QUARANTINE', 'CULLED']);

// 2. Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  username: text('username').unique().notNull(),
  fullname: text('fullname').notNull(),
  role: roleTypeEnum('role').default('OPERATOR').notNull(),
  isactive: boolean('isactive').default(true).notNull(),
  phone: text('phone'),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
  updatedat: timestamp('updatedat', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Batches Table
export const batches = pgTable('batches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  strainname: text('strainname').notNull(),
  status: batchStatusEnum('status').default('ACTIVE').notNull(),
  startdate: timestamp('startdate', { withTimezone: true }).defaultNow().notNull(),
  enddate: timestamp('enddate', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
  updatedat: timestamp('updatedat', { withTimezone: true }).defaultNow().notNull(),
});

// 3b. Mother Plants Table
export const motherPlants = pgTable('mother_plants', {
  id: text('id').primaryKey(),
  strainname: text('strainname').notNull(),
  roomname: text('roomname').notNull(),
  status: motherStatusEnum('status').default('ACTIVE').notNull(),
  acquiredat: timestamp('acquiredat', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
  updatedat: timestamp('updatedat', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Plants Table
export const plants = pgTable('plants', {
  id: text('id').primaryKey(),
  strainname: text('strainname').notNull(),
  stage: plantStageEnum('stage').default('CLONE').notNull(),
  roomname: text('roomname').notNull(),
  plantedat: timestamp('plantedat', { withTimezone: true }).defaultNow().notNull(),
  harvestedat: timestamp('harvestedat', { withTimezone: true }),
  batchid: text('batchid').references(() => batches.id, { onDelete: 'set null' }),
  motherid: text('motherid').references(() => motherPlants.id, { onDelete: 'set null' }),
  archivereason: text('archivereason'),
  metadata: jsonb('metadata'),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
  updatedat: timestamp('updatedat', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Cultivation Logs
export const cultivationLogs = pgTable('cultivation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  logdate: timestamp('logdate', { withTimezone: true }).defaultNow().notNull(),
  batchid: text('batchid').references(() => batches.id, { onDelete: 'cascade' }),
  roomname: text('roomname').notNull(),
  watervolume: doublePrecision('watervolume').notNull(),
  waterunit: text('waterunit').default('liters').notNull(),
  phin: doublePrecision('phin').notNull(),
  ecin: doublePrecision('ecin').notNull(),
  runoffvolume: doublePrecision('runoffvolume'),
  phout: doublePrecision('phout'),
  ecout: doublePrecision('ecout'),
  nutrientsfeed: jsonb('nutrientsfeed').notNull(),
  operatorid: uuid('operatorid').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  notes: text('notes'),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
  updatedat: timestamp('updatedat', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Environmental Logs
export const environmentalLogs = pgTable('environmental_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordedat: timestamp('recordedat', { withTimezone: true }).defaultNow().notNull(),
  roomname: text('roomname').notNull(),
  tempc: doublePrecision('tempc').notNull(),
  humidityrh: doublePrecision('humidityrh').notNull(),
  vpd: doublePrecision('vpd'),
  ppfd: integer('ppfd'),
  dli: doublePrecision('dli'),
  sensorraw: jsonb('sensorraw'),
  sensorid: text('sensorid'),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
});

// 7. GACP Compliance Checklists
export const gacpComplianceChecklists = pgTable('gacp_compliance_checklists', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkdate: text('checkdate').unique().notNull(), // standard GACP Date format YYYY-MM-DD
  operatorid: uuid('operatorid').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  tasks: jsonb('tasks').notNull(),
  haspestincident: boolean('haspestincident').default(false).notNull(),
  incidentdetails: text('incidentdetails'),
  correctiveaction: text('correctiveaction'),
  audittrail: jsonb('audittrail').default('[]').notNull(),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
  updatedat: timestamp('updatedat', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Action Logs (Audit Trail)
export const actionLogs = pgTable('action_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  actiontype: text('actiontype').notNull(),
  operatorid: uuid('operatorid').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  targettype: text('targettype').notNull(),
  targetid: text('targetid').notNull(),
  plantid: text('plantid').references(() => plants.id, { onDelete: 'cascade' }),
  details: jsonb('details').notNull(),
  createdat: timestamp('createdat', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Rooms Table
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').unique().notNull(),
  type: roomTypeEnum('type').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
