-- Enable RLS on every table and require a signed-in Supabase session
-- (PostgREST role `authenticated`) for all access.
--
-- Context: as of 2026-07-17 RLS was disabled on every table in this
-- project (confirmed via pg_class.relrowsecurity / pg_policies — zero
-- policies existed anywhere). That means the anon key alone, with no
-- login, could read/write every row in every table. The app already
-- requires supabase.auth.signInWithPassword() before touching any table
-- (see LoginScreen / src/services/auth.ts), so closing this gap with a
-- single "must be authenticated" policy per table changes nothing for
-- real usage — it only blocks unauthenticated requests.
--
-- Deliberately NOT role-scoped (OPERATOR/SUPERVISOR/AUDITOR/ADMIN) yet —
-- that's finer-grained than today's actual access pattern (role checks
-- are UI-only right now) and would be a behavior change, not just closing
-- a hole. Add per-role policies in a later migration if/when that's
-- actually needed.
--
-- No triggers added: security_migration.sql's audit-log triggers and
-- fix_users_phone_constraint.sql's handle_new_user() rewrite were
-- confirmed never applied to this DB (Step 0 of the Phase 3 plan) and
-- are not needed — action_logs rows are written explicitly by the app via
-- useCreateActionLog(), and usersService.registerOperator() already does
-- the public.users insert client-side after auth signup.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_authenticated_all ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY batches_authenticated_all ON public.batches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY plants_authenticated_all ON public.plants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY rooms_authenticated_all ON public.rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.cultivation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY cultivation_logs_authenticated_all ON public.cultivation_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.environmental_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY environmental_logs_authenticated_all ON public.environmental_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.gacp_compliance_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY gacp_compliance_checklists_authenticated_all ON public.gacp_compliance_checklists
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY action_logs_authenticated_all ON public.action_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
