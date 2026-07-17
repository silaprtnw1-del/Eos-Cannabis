-- batches was previously read-only (see 0002_role_based_rls.sql, comment
-- "batches — read-only, no app write path exists"). This adds the write
-- path now that RegisterTab.tsx creates a batches row per new clone
-- registration, so plants are no longer left with a null batchid.
CREATE POLICY batches_insert_operator_above ON public.batches
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('OPERATOR', 'SUPERVISOR', 'ADMIN'));
