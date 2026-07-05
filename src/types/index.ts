/**
 * Shared TypeScript types for PHANNAPHA GACP Farm Manager
 *
 * Derived from the Drizzle schema at /root/mobile_app/schema.ts.
 * Import these instead of using `any` or re-declaring inline types.
 */
import type { Session, User } from '@supabase/supabase-js';

// ─── Re-exports ─────────────────────────────────────────────────────────────
// Convenience re-exports so screens can import everything from one place.

export type { Session, User };

// ─── Screen Names ───────────────────────────────────────────────────────────
// Replaces loose `string` type for navigation state.

export type ScreenName = 'dashboard' | 'nutrients' | 'plants_directory' | 'logs' | 'vpd' | 'users';

// ─── Database Enums ─────────────────────────────────────────────────────────

/** User roles from `role_type` enum */
export type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'AUDITOR' | 'ADMIN';

/** Plant lifecycle stages from `plant_stage` enum */
export type PlantStage = 'CLONE' | 'VEG' | 'FLOWER' | 'HARVESTED' | 'ARCHIVED';

/** Batch status from `batch_status` enum */
export type BatchStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/** Room classification from `room_type` enum */
export type RoomType = 'CLONING' | 'VEG' | 'FLOWER' | 'DRYING' | 'CURING' | 'PACKAGING';

// ─── Database Row Types ─────────────────────────────────────────────────────

/** Row from `plants` table */
export interface Plant {
  id: string;
  strainname: string;
  stage: PlantStage;
  roomname: string;
  plantedat: string;
  harvestedat?: string | null;
  batchid: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Row from `batches` table */
export interface Batch {
  id: string;
  name: string;
  strainname: string;
  status?: BatchStatus;
  startdate?: string;
  enddate?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Row from `rooms` table */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  is_active?: boolean;
}

/** Latest climate reading per room (derived from `environmental_logs`) */
export interface ClimateMetric {
  roomname: string;
  tempc: number;
  humidityrh: number;
  vpd: number;
  ppfd?: number | null;
  dli?: number | null;
}

/** Row from `gacp_compliance_checklists` table */
export interface ChecklistLog {
  id: string;
  checkdate: string;
  tasks: Record<string, boolean>;
  haspestincident: boolean;
  incidentdetails: string | null;
  correctiveaction: string | null;
  operatorid?: string;
}

/** Row from `cultivation_logs` table */
export interface CultivationLog {
  id: string;
  logdate: string;
  roomname: string;
  watervolume: number;
  waterunit?: string;
  phin: number;
  ecin: number;
  runoffvolume?: number | null;
  phout: number | null;
  ecout: number | null;
  nutrientsfeed?: Record<string, unknown>;
  operatorid?: string;
  notes?: string | null;
}

/** Row from `environmental_logs` table */
export interface EnvironmentalLog {
  id: string;
  recordedat: string;
  roomname: string;
  tempc: number;
  humidityrh: number;
  vpd: number | null;
  ppfd: number | null;
  dli: number | null;
  sensorraw?: Record<string, unknown> | null;
  sensorid?: string | null;
}

/** Minimal user profile used by the app after login */
export interface UserProfile {
  role: UserRole;
  fullname: string;
}

/** Row from `action_logs` table */
export interface ActionLog {
  id: string;
  timestamp: string;
  actiontype: string;
  operatorid: string;
  targettype: string;
  targetid: string;
  plantid?: string | null;
  details: Record<string, unknown>;
}

// ─── Nutrient Feed Item ─────────────────────────────────────────────────────
// Typed shape for the JSONB `nutrientsfeed` column.

export interface NutrientFeedItem {
  name: string;
  amountMl: number;
}
