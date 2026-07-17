# Handshake — Eos-Cannabis

Continuing on your computer. State as of `61f4e0c` on `refactor/phase-1-foundation` (pushed, in sync with origin).

## Done

- **Phase 1**: role-based RLS + `canPerform()` permission gating, merged Register/Import tabs, fixed orphaned-`batchid` bug on new registrations.
- **Phase 2**: mother-plant lineage (`mother_plants` table, `plants.motherid`/`archivereason`), clone success-rate stats in `MotherPlantsTab`.
- **Plant Directory redesign** (all 5 tabs): scrollable auto-width `SubTabBar`, shared `PillSelector` (replaced 4 duplicated toggle-row blocks), card-styled mother list rows, `ErrorState`+retry on every tab's queries. Verified via `tsc --noEmit` + `npm test` only — **never visually checked**, this Termux env has no `react-dom`/`react-native-web` installed and no emulator.

## Pending

1. **Data backfill** (paused by user) — real farm has 100+ clones, 10-20 mothers, 2 flower rooms (mixed strains, not 1 strain/room) already growing. `batches` table is empty (0 rows) but `plants.batchid` has 2 orphaned values (`BATCH-2026-W25-SBC`×28, `BATCH-2026-W26-MNT`×2) predating the Phase 1 fix. Plan was direct SQL insert via Supabase MCP once user gives strain/count breakdown per room — no new UI code needed, this is one-time catch-up not a recurring flow.
2. **Visual QA** — open the redesigned Plant Directory on a real device/browser, confirm nothing broke.
3. **Other screens untouched** — Dashboard, SopLogs, UserManagement, VpdCalculator, Login never got the same design pass, only Plant Directory was requested.
4. **Sales/profitability tracking** — explicitly out of scope (user confirmed), no data model exists for it at all.

## Environment notes (Termux-specific, won't apply on your computer)

- `Grep`/`Glob` tools fail (`rg ENOENT`, ripgrep binary missing) — was using `Bash grep -n`/`ls` as fallback. Should just work normally on a real machine.
- No `expo start --web` (missing `react-dom`/`react-native-web`), no adb/emulator — couldn't preview UI changes.

## Supabase (MCP connected)

Project: `Eos-cannabis-farm`, ref `jfluzuqslgmnlkltupyp`, region ap-southeast-2, ACTIVE_HEALTHY.
Live row counts: users 4, plants 30 (list_tables estimate said 24, actual `count(*)` is 30), rooms 2, mother_plants 1, action_logs 11, cultivation_logs 3, batches 0, environmental_logs 0, gacp_compliance_checklists 0.

## Conventions to keep following

- Layering: `screens/*.tsx` → `src/hooks/use*.ts` → `src/services/*.ts` → Supabase. Never call Supabase from a screen.
- Design tokens only from `src/constants/theme.ts` (`colors`/`spacing`/`radius`/`fontSize`/`fontWeight`/`commonStyles`), reuse `GlassCard`/`EmptyState`/`ErrorState`/`PillSelector` from `src/components/ui` before inventing new styles.
- Every domain action gets a manual `action_logs` entry via `useCreateActionLog()` — no DB trigger does this.
- Migrations: `migrations/000N_*.sql`, applied to live DB with `npm run db:migrate` (or now via Supabase MCP `apply_migration`).
- See `AGENTS.md` for the full rundown + Obsidian SOP vault path for domain/GACP rules.
