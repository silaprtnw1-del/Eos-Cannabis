# Eos-Cannabis (PHANNAPHA GACP Farm Manager)

Expo/React Native app for a single Thai cannabis farm to track cultivation
activity — plants, rooms, batches, nutrient logs, GACP compliance
checklists — against Thai GACP (Good Agricultural and Collection Practices)
audit requirements.

## Stack

- Expo SDK 57 + expo-router, React 19 / React Native 0.86
- Supabase (Postgres) backend, `drizzle-orm`/`drizzle-kit` schema
  (`schema.ts`), local offline mirror via `expo-sqlite` (`localDb.ts`)
- `@tanstack/react-query` (server state) + `zustand` (client state)
- TypeScript (strict)

## Setup

```bash
npm install
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npm start               # or: npm run android
```

`DATABASE_URL` in `.env` is only used by drizzle-kit and the scripts in
`scripts/` — the mobile app itself only talks to Supabase via the anon key.

## Scripts

| Command             | Purpose                          |
|----------------------|-----------------------------------|
| `npm start`          | Start Metro / Expo dev server     |
| `npm run android`    | Start and open on Android         |
| `npm run ios`        | Start and open on iOS             |
| `npm run web`        | Start and open in browser         |
| `npm run typecheck`  | `tsc --noEmit`                    |

## Architecture

```
screens/*.tsx  →  src/hooks/use*.ts  →  src/services/*.ts  →  Supabase / localDb
```

Screens hold JSX and call hooks only; hooks wrap react-query around one
service each; services are the only layer that talks to Supabase and always
return a `Result<T>` (never throw). Writes to `cultivation_logs` and
`gacp_checklists` fall back to local SQLite when offline and sync
automatically on reconnect (see `src/services/sync.ts`).

Full conventions and architecture notes for contributors/agents live in
[`AGENTS.md`](./AGENTS.md).

## License

MIT (see [`LICENSE`](./LICENSE)).
