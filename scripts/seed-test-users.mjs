#!/usr/bin/env node
/**
 * Seed OPERATOR/SUPERVISOR/AUDITOR test accounts for on-device RBAC
 * testing (see migrations/0002_role_based_rls.sql). Mirrors the
 * auth.users/auth.identities/public.users pattern in
 * seed_default_admin.sql — idempotent, safe to re-run.
 *
 * Usage: node scripts/seed-test-users.mjs
 */
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('FAIL: DATABASE_URL not set (check .env is loaded)');
  process.exit(1);
}

const TEST_USERS = [
  { email: 'test-operator@apn-farm.com', password: 'TestOperator@2026', fullName: 'Test Operator', role: 'OPERATOR' },
  { email: 'test-supervisor@apn-farm.com', password: 'TestSupervisor@2026', fullName: 'Test Supervisor', role: 'SUPERVISOR' },
  { email: 'test-auditor@apn-farm.com', password: 'TestAuditor@2026', fullName: 'Test Auditor', role: 'AUDITOR' },
];

const sqlFor = ({ email, password, fullName, role }) => `
DO $$
DECLARE
  u_email    TEXT := '${email}';
  u_password TEXT := '${password}';
  u_name     TEXT := '${fullName}';
  u_role     TEXT := '${role}';
  v_user_id  UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = u_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', u_email,
      crypt(u_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('role', u_role, 'fullName', u_name),
      NOW(), NOW(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(u_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', u_role, 'fullName', u_name),
           updated_at = NOW()
     WHERE id = v_user_id;
  END IF;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', u_email),
    'email', v_user_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO public.users (id, username, fullname, role, isactive)
  VALUES (v_user_id, u_email, u_name, u_role::role_type, true)
  ON CONFLICT (id) DO UPDATE
    SET role = u_role::role_type, fullname = u_name, username = u_email, isactive = true;

  RAISE NOTICE '% ready: % (id=%)', u_role, u_email, v_user_id;
END $$;
`;

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
});

try {
  await client.connect();
  for (const u of TEST_USERS) {
    await client.query(sqlFor(u));
    console.log(`OK — ${u.role}: ${u.email} / ${u.password}`);
  }
} catch (e) {
  console.error('FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
