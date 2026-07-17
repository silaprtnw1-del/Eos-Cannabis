#!/usr/bin/env node
/**
 * Headless verification that migrations/0002_role_based_rls.sql actually
 * enforces the RBAC matrix at the DB layer (the real security boundary —
 * client-side canPerform() checks are UX only). Signs in as each test
 * account (scripts/seed-test-users.mjs) via the anon key + Supabase Auth,
 * same as the mobile app would, and attempts representative writes.
 *
 * Usage: node scripts/verify-rls.mjs
 */
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('FAIL: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set');
  process.exit(1);
}

const CREDS = {
  OPERATOR: { email: 'test-operator@apn-farm.com', password: 'TestOperator@2026' },
  SUPERVISOR: { email: 'test-supervisor@apn-farm.com', password: 'TestSupervisor@2026' },
  AUDITOR: { email: 'test-auditor@apn-farm.com', password: 'TestAuditor@2026' },
};

let pass = 0, fail = 0;
const results = [];

function record(label, expected, actualOk) {
  const ok = expected === actualOk;
  results.push({ label, expected: expected ? 'ALLOW' : 'DENY', actual: actualOk ? 'ALLOW' : 'DENY', ok });
  if (ok) pass++; else fail++;
}

async function signIn(role) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword(CREDS[role]);
  if (error) throw new Error(`sign-in failed for ${role}: ${error.message}`);
  return { client, userId: data.user.id };
}

const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await pgClient.connect();

  // Fixture plant (inserted directly via the pg superuser connection,
  // bypassing RLS) for the UPDATE-permission tests below.
  const fixtureId = `TESTRLS-${Date.now()}`;
  await pgClient.query(
    `INSERT INTO public.plants (id, strainname, roomname, stage) VALUES ($1, 'RLS Test', 'Test Room', 'VEG')`,
    [fixtureId]
  );

  const insertedIds = { plants: [fixtureId], rooms: [], cultivation_logs: [], gacp_compliance_checklists: [], action_logs: [] };

  // ── OPERATOR ─────────────────────────────────────────────────────
  {
    const { client, userId } = await signIn('OPERATOR');

    const newPlantId = `TESTRLS-OP-${Date.now()}`;
    const r1 = await client.from('plants').insert({ id: newPlantId, strainname: 'RLS Test', roomname: 'Test Room' });
    record('OPERATOR insert plants (register clone)', true, !r1.error);
    if (!r1.error) insertedIds.plants.push(newPlantId);

    const r2 = await client.from('rooms').insert({ name: `RLS-Test-Room-${Date.now()}`, type: 'VEG' });
    record('OPERATOR insert rooms (create room)', false, !r2.error);
    if (!r2.error) insertedIds.rooms.push(r2.data?.[0]?.name);

    const r3 = await client.from('plants').update({ stage: 'ARCHIVED' }).eq('id', fixtureId).select();
    record('OPERATOR update plants stage=ARCHIVED (archive)', false, !r3.error && r3.data && r3.data.length > 0);

    const r4 = await client.from('cultivation_logs').insert({
      roomname: 'Test Room', watervolume: 1, phin: 6, ecin: 1.5, nutrientsfeed: {}, operatorid: userId,
    });
    record('OPERATOR insert cultivation_logs (own id)', true, !r4.error);

    const r5 = await client.from('action_logs').select('*').limit(1);
    record('OPERATOR select action_logs', false, !r5.error && r5.data && r5.data.length > 0);

    await client.auth.signOut();
  }

  // ── SUPERVISOR ───────────────────────────────────────────────────
  {
    const { client, userId } = await signIn('SUPERVISOR');

    const r1 = await client.from('plants').update({ roomname: 'Veg Room B' }).eq('id', fixtureId).select();
    record('SUPERVISOR update plants roomname (transfer)', true, !r1.error && r1.data && r1.data.length > 0);

    const r2 = await client.from('plants').update({ stage: 'ARCHIVED' }).eq('id', fixtureId).select();
    record('SUPERVISOR update plants stage=ARCHIVED (archive)', false, !r2.error && r2.data && r2.data.length > 0);

    const r3 = await client.from('rooms').insert({ name: `RLS-Test-Room-Sup-${Date.now()}`, type: 'VEG' });
    record('SUPERVISOR insert rooms (create room)', false, !r3.error);
    if (!r3.error) insertedIds.rooms.push(r3.data?.[0]?.name);

    await client.auth.signOut();
  }

  // ── AUDITOR ──────────────────────────────────────────────────────
  {
    const { client, userId } = await signIn('AUDITOR');

    const newPlantId = `TESTRLS-AUD-${Date.now()}`;
    const r1 = await client.from('plants').insert({ id: newPlantId, strainname: 'RLS Test', roomname: 'Test Room' });
    record('AUDITOR insert plants (register clone)', false, !r1.error);
    if (!r1.error) insertedIds.plants.push(newPlantId);

    const r2 = await client.from('cultivation_logs').insert({
      roomname: 'Test Room', watervolume: 1, phin: 6, ecin: 1.5, nutrientsfeed: {}, operatorid: userId,
    });
    record('AUDITOR insert cultivation_logs', false, !r2.error);

    const r3 = await client.from('action_logs').select('*').limit(1);
    record('AUDITOR select action_logs (oversight read)', true, !r3.error && r3.data && r3.data.length > 0);

    const r4 = await client.from('action_logs').insert({
      actiontype: 'TEST_ACTION', operatorid: userId, targettype: 'TEST', targetid: 'x', details: {},
    });
    record('AUDITOR insert action_logs (own id, always allowed)', true, !r4.error);

    await client.auth.signOut();
  }

  // ── Cleanup (direct pg connection, bypasses RLS) ────────────────
  for (const id of insertedIds.plants) {
    await pgClient.query('DELETE FROM public.plants WHERE id = $1', [id]).catch(() => {});
  }
  for (const name of insertedIds.rooms.filter(Boolean)) {
    await pgClient.query('DELETE FROM public.rooms WHERE name = $1', [name]).catch(() => {});
  }
  await pgClient.query(`DELETE FROM public.cultivation_logs WHERE roomname = 'Test Room' AND watervolume = 1 AND nutrientsfeed = '{}'::jsonb`).catch(() => {});
  await pgClient.query(`DELETE FROM public.action_logs WHERE actiontype = 'TEST_ACTION'`).catch(() => {});

  await pgClient.end();

  console.log('\n=== RLS Verification Results ===');
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.label} — expected ${r.expected}, got ${r.actual}`);
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
