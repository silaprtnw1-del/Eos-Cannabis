-- ============================================================
-- PHANNAPHA GACP — Security migration
-- Run via: Supabase Dashboard → SQL Editor → New query → paste & run
-- OR:    psql "$DATABASE_URL" -f security_migration.sql
--
-- This migration:
--   1. Replaces every `TO public` RLS policy with `TO authenticated`
--      plus role-scoped checks.
--   2. Stops trusting client-supplied `user_metadata.role`.
--   3. Adds a `current_user_role()` helper for policy reuse.
--   4. Adds transactional audit triggers so action_logs cannot be
--      orphaned if the main mutation succeeds but the log insert
--      fails (or vice versa).
--
-- Prerequisite: assumes the schema in apn_cms_supabase_schema.sql
-- has already been applied.
-- ============================================================

BEGIN;

-- ─── Helper: current user's role from the users table ────────────────
-- Returns NULL for anonymous / not-yet-profiled users.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ─── Helper: is the current user at least a supervisor? ─────────────
CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    public.current_user_role() IN ('SUPERVISOR', 'ADMIN'),
    FALSE
  );
$$;

-- ─── Helper: is the current user an admin? ──────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'ADMIN', FALSE);
$$;

-- ============================================================
-- 1. users — PII (fullname, phone). Lock down hard.
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow users to edit their own profile" ON public.users;

-- Read: own row always; supervisor+ may read all (for User Management screen).
CREATE POLICY "users_read_own_or_supervisor_above"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.is_supervisor_or_above()
  );

-- Write: admin only. Users cannot self-edit role/phone (admins do that).
CREATE POLICY "users_write_admin_only"
  ON public.users FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 2. plants
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to plants" ON public.plants;
DROP POLICY IF EXISTS "Allow operators and above to edit plants" ON public.plants;

CREATE POLICY "plants_read_authenticated"
  ON public.plants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "plants_insert_operator_above"
  ON public.plants FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));

CREATE POLICY "plants_update_supervisor_above"
  ON public.plants FOR UPDATE
  TO authenticated
  USING (public.is_supervisor_or_above())
  WITH CHECK (public.is_supervisor_or_above());

-- Hard delete stays admin-only. Soft-delete (stage = 'ARCHIVED') is UPDATE.
CREATE POLICY "plants_delete_admin_only"
  ON public.plants FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 3. rooms
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow only admins/master growers to modify rooms" ON public.rooms;

CREATE POLICY "rooms_read_authenticated"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rooms_write_admin_only"
  ON public.rooms FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 4. batches
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to batches" ON public.batches;
DROP POLICY IF EXISTS "Allow supervisors/admins to modify batches" ON public.batches;
DROP POLICY IF EXISTS "Allow operators to read batches" ON public.batches;

CREATE POLICY "batches_read_authenticated"
  ON public.batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "batches_write_supervisor_above"
  ON public.batches FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_above())
  WITH CHECK (public.is_supervisor_or_above());

-- ============================================================
-- 5. cultivation_logs (nutrient / irrigation records)
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to cultivation logs" ON public.cultivation_logs;
DROP POLICY IF EXISTS "Allow operators to add logs" ON public.cultivation_logs;

CREATE POLICY "cultivation_logs_read_authenticated"
  ON public.cultivation_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cultivation_logs_insert_operator_above"
  ON public.cultivation_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));

CREATE POLICY "cultivation_logs_update_supervisor_above"
  ON public.cultivation_logs FOR UPDATE
  TO authenticated
  USING (public.is_supervisor_or_above())
  WITH CHECK (public.is_supervisor_or_above());

-- ============================================================
-- 6. environmental_logs
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to environmental logs" ON public.environmental_logs;
DROP POLICY IF EXISTS "Allow insertion of environmental logs" ON public.environmental_logs;

CREATE POLICY "environmental_logs_read_authenticated"
  ON public.environmental_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "environmental_logs_insert_operator_above"
  ON public.environmental_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));

-- ============================================================
-- 7. gacp_compliance_checklists
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to compliance checklists" ON public.gacp_compliance_checklists;
DROP POLICY IF EXISTS "Allow operators to write compliance checklists" ON public.gacp_compliance_checklists;

CREATE POLICY "checklists_read_authenticated"
  ON public.gacp_compliance_checklists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "checklists_upsert_operator_above"
  ON public.gacp_compliance_checklists FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));

CREATE POLICY "checklists_update_operator_above"
  ON public.gacp_compliance_checklists FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'))
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));

-- ============================================================
-- 8. action_logs — audit trail. Most restrictive.
--    Operators can INSERT (audit their own actions) but cannot SELECT.
--    Supervisors/admins/auditors can SELECT. No one UPDATEs/DELETEs.
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to action logs" ON public.action_logs;

CREATE POLICY "action_logs_insert_authenticated"
  ON public.action_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "action_logs_read_supervisor_above"
  ON public.action_logs FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('SUPERVISOR', 'AUDITOR', 'ADMIN')
  );

-- No UPDATE or DELETE policies = those operations are denied.

-- ============================================================
-- 9. Audit trigger functions (transactional)
--    Wrap mutations so the audit row is written in the same tx
--    as the mutation itself. If the audit insert fails, the whole
--    mutation rolls back — no orphan state.
-- ============================================================

-- Trigger: log every plant stage/room transfer.
CREATE OR REPLACE FUNCTION public.audit_plant_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.roomname IS DISTINCT FROM NEW.roomname)
     OR (OLD.stage IS DISTINCT FROM NEW.stage) THEN
    INSERT INTO public.action_logs (
      actiontype, operatorid, targettype, targetid, plantid, details
    ) VALUES (
      'TRANSFER_PLANT',
      auth.uid(),
      'PLANT',
      NEW.id,
      NEW.id,
      jsonb_build_object(
        'from_room', OLD.roomname,
        'to_room', NEW.roomname,
        'from_stage', OLD.stage,
        'to_stage', NEW.stage
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plant_transfer_audit ON public.plants;
CREATE TRIGGER trg_plant_transfer_audit
  AFTER UPDATE ON public.plants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_plant_transfer();

-- Trigger: log plant archival (soft-delete).
CREATE OR REPLACE FUNCTION public.audit_plant_archive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage <> 'ARCHIVED' AND NEW.stage = 'ARCHIVED' THEN
    INSERT INTO public.action_logs (
      actiontype, operatorid, targettype, targetid, plantid, details
    ) VALUES (
      'ARCHIVE_PLANT',
      auth.uid(),
      'PLANT',
      NEW.id,
      NEW.id,
      jsonb_build_object(
        'previous_stage', OLD.stage,
        'previous_room', OLD.roomname
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plant_archive_audit ON public.plants;
CREATE TRIGGER trg_plant_archive_audit
  AFTER UPDATE ON public.plants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_plant_archive();

-- Trigger: log user activation/deactivation.
CREATE OR REPLACE FUNCTION public.audit_user_status_toggle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.isactive IS DISTINCT FROM NEW.isactive THEN
    INSERT INTO public.action_logs (
      actiontype, operatorid, targettype, targetid, details
    ) VALUES (
      CASE WHEN NEW.isactive THEN 'ACTIVATE_USER' ELSE 'DEACTIVATE_USER' END,
      auth.uid(),
      'USER',
      NEW.id,
      jsonb_build_object('status', NEW.isactive)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_status_audit ON public.users;
CREATE TRIGGER trg_user_status_audit
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_status_toggle();

COMMIT;

-- ============================================================
-- 10. Append-only audittrail for gacp_compliance_checklists
--     The app used to overwrite the audittrail array on each upsert,
--     losing prior submit history. Trigger now appends a new entry
--     on every INSERT or UPDATE, so the app no longer sends the
--     audittrail field.
-- ============================================================

CREATE OR REPLACE FUNCTION public.append_checklist_audittrail()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry JSONB;
BEGIN
  entry := jsonb_build_object(
    'timestamp', now() AT TIME ZONE 'UTC',
    'operator', auth.uid(),
    'action', CASE WHEN TG_OP = 'INSERT' THEN 'CREATE_CHECKLIST' ELSE 'UPDATE_CHECKLIST' END
  );
  IF NEW.audittrail IS NULL THEN
    NEW.audittrail := jsonb_build_array(entry);
  ELSE
    NEW.audittrail := NEW.audittrail || jsonb_build_array(entry);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_checklist_audittrail ON public.gacp_compliance_checklists;
CREATE TRIGGER trg_checklist_audittrail
  BEFORE INSERT OR UPDATE ON public.gacp_compliance_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.append_checklist_audittrail();

-- ============================================================
-- Post-migration verification (run manually, not in a tx):
--   \dp public.users
--   SELECT polname, polcmd, array_agg(rolname)
--     FROM pg_policies JOIN pg_roles ON polroles::oid[] @> ARRAY[oid]
--    GROUP BY polname, polcmd;
-- ============================================================
