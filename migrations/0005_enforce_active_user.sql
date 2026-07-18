-- Enforce account deactivation (users.isactive) at the database layer.
--
-- Problem this closes: before this migration, setting users.isactive = false
-- (the "Deactivate" button in UserManagementScreen) had NO security effect.
-- Nothing in the RLS policy set or the auth path checked isactive, so a
-- deactivated user kept a working session (persisted in SecureStore, token
-- auto-refreshed) and could still read/write every table their role allowed.
-- LoginScreen only checked that a profile row existed, not that it was active.
--
-- Fix: isactive is now part of the server-side gate.
--   1. current_user_role() returns the role only for ACTIVE users, so every
--      role-scoped write policy (is_admin / is_supervisor_or_above / the
--      role-IN(...) INSERT/UPDATE/DELETE checks) denies a deactivated user
--      with no policy rewrites needed — they all build on this function.
--   2. is_active_user() gates the previously wide-open SELECT policies so a
--      deactivated (or profile-less) user cannot read farm data either.
--
-- users_select_own_or_admin is deliberately left untouched: a deactivated
-- user must still be able to read their OWN users row (id = auth.uid()) so the
-- app's login / session-restore path can detect isactive = false and sign
-- them out cleanly.

-- ─── Helper functions ───────────────────────────────────────────────────────

-- Now filters on isactive: a deactivated user resolves to NULL role, which
-- fails every `role IN (...)` / is_admin() / is_supervisor_or_above() check.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND isactive = TRUE;
$$;

-- TRUE only when the caller has an active public.users row. Returns FALSE for
-- deactivated users and for auth users with no profile row (e.g. self-signup).
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT isactive FROM public.users WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ─── Re-gate the open SELECT policies behind is_active_user() ───────────────
-- These were `USING (true)` (any authenticated user). action_logs' SELECT
-- policy already routes through current_user_role() and is covered for free.

DROP POLICY IF EXISTS batches_select_authenticated ON public.batches;
CREATE POLICY batches_select_authenticated ON public.batches
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS plants_select_authenticated ON public.plants;
CREATE POLICY plants_select_authenticated ON public.plants
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS rooms_select_authenticated ON public.rooms;
CREATE POLICY rooms_select_authenticated ON public.rooms
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS cultivation_logs_select_authenticated ON public.cultivation_logs;
CREATE POLICY cultivation_logs_select_authenticated ON public.cultivation_logs
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS environmental_logs_select_authenticated ON public.environmental_logs;
CREATE POLICY environmental_logs_select_authenticated ON public.environmental_logs
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS checklists_select_authenticated ON public.gacp_compliance_checklists;
CREATE POLICY checklists_select_authenticated ON public.gacp_compliance_checklists
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS mother_plants_select_authenticated ON public.mother_plants;
CREATE POLICY mother_plants_select_authenticated ON public.mother_plants
  FOR SELECT TO authenticated
  USING (public.is_active_user());
