# sql-archive

Legacy hand-written SQL files, kept for history — superseded by
`schema.ts` (drizzle) + `migrations/` as of Phase 3 (2026-07-17).

- **`apn_cms_supabase_schema.sql`** + **`security_migration.sql`** — real
  lineage of the current schema. `security_migration.sql`'s audit-log
  triggers and RLS were written but **never applied** to the live DB
  (confirmed via `pg_trigger`/`pg_policies` before Phase 3) — `migrations/0001_rls_and_triggers.sql`
  is the actually-applied replacement, deliberately simpler (no triggers,
  single `authenticated`-only policy per table).
- **`fix_users_phone_constraint.sql`** — a `handle_new_user()` trigger
  rewrite targeting a `phone` column that didn't exist yet at the time it
  was written, and was never applied either. The `phone` column now exists
  (added directly, then captured in `schema.ts`/`migrations/0000_baseline.sql`),
  but no DB trigger creates `public.users` rows — `usersService.registerOperator()`
  does that insert client-side, which is the verified-correct sole write path.
- **`supabase_schema.sql`** — always dead. Defines an unrelated
  `profiles`/`telemetry_logs`/`nutrient_logs`/`sop_tasks` table set that
  this app never used.
