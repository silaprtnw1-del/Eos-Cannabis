# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, etc.) working in this repo.

## Read this first

Expo HAS CHANGED. Read the exact versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing any Expo/RN code —
do not rely on training-data knowledge of older Expo/RN APIs.

## What this is

Eos-Cannabis (a.k.a. PHANNAPHA GACP Farm Manager) — an Expo/React Native app
for a single Thai cannabis farm to track cultivation activity (plants,
rooms, batches, nutrient logs, GACP compliance checklists) against Thai
GACP (Good Agricultural and Collection Practices) audit requirements.

## Stack

- Expo SDK 57 + expo-router (file-based routing, see `app/`)
- React 19 / React Native 0.86
- Supabase (Postgres) as the backend, `@supabase/supabase-js`
- `drizzle-orm` / `drizzle-kit` — schema lives in `schema.ts`, also used
  against local `expo-sqlite` (see `localDb.ts`)
- `@tanstack/react-query` for server state, `zustand` for client/UI state
- TypeScript strict; `npm run typecheck` must exit 0 before any work is
  considered done

## Architecture

Screens never call Supabase directly. The layering is:

```
screens/*.tsx  →  src/hooks/use*.ts  →  src/services/*.ts  →  Supabase / localDb
```

- `src/services/*.ts` — one file per domain table (`plants.ts`, `users.ts`,
  `cultivationLogs.ts`, ...). Every call returns a `Result<T>`
  (`src/services/result.ts`) instead of throwing: `{ data, error: null }` or
  `{ data: null, error: Error }`. Supabase errors are plain objects, not
  real `Error` instances — always go through `err()` to normalize them,
  never `new Error(String(supabaseError))` (this exact bug shipped once,
  see git history on `src/services/result.ts`).
- `src/hooks/use*.ts` — wraps each service in `useQuery`/`useMutation`,
  calling `unwrap()` to convert `Result<T>` into throw-on-error for
  react-query. This is the only layer screens should import from.
- Offline write path (`cultivation_logs` and `gacp_checklists` only): a
  mutation tries Supabase first; on a network error (`isNetworkError()` in
  `result.ts`) it falls back to local SQLite (`localDb.ts`) and resolves
  `{ queued: true }` instead of failing. `src/services/sync.ts` drains the
  local queue on reconnect. See `src/hooks/useSyncStatus.ts` for the
  pending-sync count/polling logic.
- Every domain action (`REGISTER_CLONES`, `TRANSFER_PLANT`,
  `ARCHIVE_PLANT`, `ACTIVATE_USER`, ...) is manually logged to
  `action_logs` via `useCreateActionLog()` — this is the GACP audit trail
  and there is currently no DB trigger doing this for you. Don't drop it
  when refactoring a screen.

## Commands

```
npm run typecheck   # tsc --noEmit — run after every change
npm start           # expo start
npm run android
```

## Conventions

- No speculative abstractions — this is a single-farm app, not a platform.
  Don't add config, feature flags, or generic frameworks for one caller.
- Prefer the smallest correct diff. Reuse an existing hook/service before
  writing a new one.
- Never hardcode credentials. `.env` is gitignored and is the only place
  secrets belong; `DATABASE_URL` there is drizzle-kit/scripts-only, never
  used by the mobile app itself (see `.env.example`).

## Domain knowledge (SOP / GACP reference)

Business rules for cultivation SOPs, nutrient feeding schedules (Athena
Pro Line, FloraFlex), VPD/CO2 environmental targets, and the official GACP
submission checklist are **not** in this repo — they live in an Obsidian
vault on-device at:

```
/sdcard/Documents/การปลูกกัญชาแบบ indoor ตามมาตรฐาน GACP และ SOP/
```

Start at `pages/index.md` for the categorized index. Most relevant to this
codebase specifically:

- `pages/backend_logic_design.md`, `pages/prisma_schema_design.md`,
  `pages/frontend_ui_design.md`, `pages/farm_ui_ux_design_system.md` —
  original APN-CMS system design notes (predate this repo's actual
  schema/code — treat as intent/reference, verify against `schema.ts` and
  the live DB before trusting a detail).
- `pages/gacp_master_submission_sop.md`, `pages/apn_qr_label_printing_sop.md`
  — the compliance/traceability rules `gacp_compliance_checklists` and
  plant QR labeling need to satisfy.
- `pages/athena_pro_line_feeding_schedule_sop.md`,
  `pages/floraflex_feeding_schedule_sop.md`, `pages/vpd_management_guide_sop.md`
  — the reference values behind `NutrientCalculatorScreen`/`VpdCalculatorScreen`.

The `raw/` folder under the same vault holds unprocessed source material —
only dig into it if `pages/` doesn't answer the question.
