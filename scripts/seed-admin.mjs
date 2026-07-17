#!/usr/bin/env node
/**
 * Run seed_default_admin.sql against Supabase via the pooler.
 *
 * Uses DATABASE_URL as-is (Supabase pooler, transaction mode, port 6543).
 * A single DO $$ block is one statement so it runs fine in transaction
 * mode. Direct host (db.<ref>.supabase.co) is often IPv6-only from
 * Termux/mobile networks, so we prefer the pooler.
 *
 * Usage:
 *   node scripts/seed-admin.mjs [email] [password] [fullName]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = resolve(__dirname, '..', 'seed_default_admin.sql');

if (!process.env.DATABASE_URL) {
  console.error('FAIL: DATABASE_URL not set (check .env is loaded, e.g. via `env $(cat .env) node ...`)');
  process.exit(1);
}
const DB = process.env.DATABASE_URL;

function overrideDefaults(sql, { email, password, fullName }) {
  let out = sql;
  if (email)    out = out.replace(/admin_email\s*TEXT\s*:=\s*'[^']*'/, `admin_email TEXT := '${email.replace(/'/g, "''")}'`);
  if (password) out = out.replace(/admin_password\s*TEXT\s*:=\s*'[^']*'/, `admin_password TEXT := '${password.replace(/'/g, "''")}'`);
  if (fullName) out = out.replace(/admin_name\s*TEXT\s*:=\s*'[^']*'/, `admin_name TEXT := '${fullName.replace(/'/g, "''")}'`);
  return out;
}

const [,, email, password, fullName] = process.argv;

const rawSql = readFileSync(SQL_PATH, 'utf8');
const sql = overrideDefaults(rawSql, { email, password, fullName });

const client = new pg.Client({
  connectionString: DB,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
});

try {
  await client.connect();
  const res = await client.query(sql);
  console.log('OK — seed executed');
  if (res.rowCount !== null) console.log(`rowCount=${res.rowCount}`);
  console.log(`Login with: ${email ?? "admin@apn-farm.com (SQL default)"}`);
} catch (e) {
  console.error('FAIL:', e.message);
  if (e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT') {
    console.error(
      '→ Pooler host unreachable. Check network / DATABASE_URL.\n' +
      '  Fallback: paste seed_default_admin.sql into Supabase Dashboard → SQL Editor.'
    );
  }
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
