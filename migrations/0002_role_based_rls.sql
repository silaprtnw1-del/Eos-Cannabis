-- Adds real per-role RLS enforcement on top of the auth-only policies
-- from 0001_rls_and_triggers.sql. AUDITOR has zero client-side UI gating
-- today (every existing check is a deny-list scoped to ADMIN/SUPERVISOR
-- actions), so this migration is the actual enforcement layer keeping
-- AUDITOR (and any other role) from writing data outside its remit.

-- ─── Helper functions (adapted from sql-archive/security_migration.sql) ────

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('SUPERVISOR', 'ADMIN'), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'ADMIN', FALSE);
$$;

-- ─── 1. users ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS users_authenticated_all ON public.users;

CREATE POLICY users_select_own_or_admin ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY users_write_admin_only ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── 2. batches — read-only, no app write path exists ───────────────
DROP POLICY IF EXISTS batches_authenticated_all ON public.batches;

CREATE POLICY batches_select_authenticated ON public.batches
  FOR SELECT TO authenticated
  USING (true);

-- ─── 3. plants ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS plants_authenticated_all ON public.plants;

CREATE POLICY plants_select_authenticated ON public.plants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY plants_insert_operator_above ON public.plants
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));

-- Transfer (room/stage change) needs SUPERVISOR+; setting stage to
-- ARCHIVED (soft-delete) needs ADMIN — mirrors DirectoryTab.tsx's split
-- client-side checks.
CREATE POLICY plants_update_supervisor_admin_archive ON public.plants
  FOR UPDATE TO authenticated
  USING (public.is_supervisor_or_above())
  WITH CHECK (
    public.is_supervisor_or_above()
    AND (stage <> 'ARCHIVED' OR public.is_admin())
  );

CREATE POLICY plants_delete_admin_only ON public.plants
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── 4. rooms ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS rooms_authenticated_all ON public.rooms;

CREATE POLICY rooms_select_authenticated ON public.rooms
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY rooms_write_admin_only ON public.rooms
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── 5. cultivation_logs — insert-only from the app, tied to own id ─
DROP POLICY IF EXISTS cultivation_logs_authenticated_all ON public.cultivation_logs;

CREATE POLICY cultivation_logs_select_authenticated ON public.cultivation_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY cultivation_logs_insert_operator_above ON public.cultivation_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN')
    AND operatorid = auth.uid()
  );

-- ─── 6. environmental_logs — read-only, no app write path exists ────
DROP POLICY IF EXISTS environmental_logs_authenticated_all ON public.environmental_logs;

CREATE POLICY environmental_logs_select_authenticated ON public.environmental_logs
  FOR SELECT TO authenticated
  USING (true);

-- ─── 7. gacp_compliance_checklists — upsert needs INSERT + UPDATE ───
DROP POLICY IF EXISTS gacp_compliance_checklists_authenticated_all ON public.gacp_compliance_checklists;

CREATE POLICY checklists_select_authenticated ON public.gacp_compliance_checklists
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY checklists_insert_operator_above ON public.gacp_compliance_checklists
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN')
    AND operatorid = auth.uid()
  );

CREATE POLICY checklists_update_operator_above ON public.gacp_compliance_checklists
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'))
  WITH CHECK (
    public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN')
    AND operatorid = auth.uid()
  );

-- ─── 8. action_logs — GACP audit trail, insert-only/immutable ──────
DROP POLICY IF EXISTS action_logs_authenticated_all ON public.action_logs;

CREATE POLICY action_logs_insert_own ON public.action_logs
  FOR INSERT TO authenticated
  WITH CHECK (operatorid = auth.uid());

CREATE POLICY action_logs_select_supervisor_above ON public.action_logs
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('SUPERVISOR', 'AUDITOR', 'ADMIN'));

-- No UPDATE or DELETE policy on action_logs for any role — deliberate,
-- matches confirmed usage (nothing in the app ever updates/deletes it).

-- Known residual edge case, not fixed here: src/services/sync.ts replays
-- offline-queued cultivation_logs/gacp_compliance_checklists writes with
-- the operatorid captured at queue time. If a different user logs in
-- before the queue drains, the operatorid = auth.uid() check above will
-- correctly reject the stale-user's queued row rather than misattributing
-- it to the new session — surfaces as a stuck sync-queue item in that
-- rare scenario.
