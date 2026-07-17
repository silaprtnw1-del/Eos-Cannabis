-- ────────────────────────────────────────────────────────────────────
-- Seed default admin user
-- Run in: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- Idempotent: safe to re-run (upserts password / role).
--
-- CHANGE THESE BEFORE RUNNING:
--   admin_email    → email you want to log in with
--   admin_password → strong password (12+ chars)
--   admin_name     → display name shown in the app header
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  admin_email    TEXT := 'admin@apn-farm.com';
  admin_password TEXT := 'Admin@Phannapha2026';
  admin_name     TEXT := 'System Admin';
  v_user_id      UUID;
BEGIN
  -- 1) Upsert into auth.users (Supabase Auth)
  SELECT id INTO v_user_id FROM auth.users WHERE email = admin_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('role','ADMIN','fullName', admin_name),
      NOW(), NOW(),
      '', '', '', ''
    );
  ELSE
    -- Reset password for existing account
    UPDATE auth.users
       SET encrypted_password = crypt(admin_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           raw_user_meta_data = raw_user_meta_data
             || jsonb_build_object('role','ADMIN','fullName', admin_name),
           updated_at = NOW()
     WHERE id = v_user_id;
  END IF;

  -- 2) Ensure identity row exists (required by Supabase Auth for email login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', admin_email),
    'email',
    v_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 3) Upsert into public.users (app-level profile with role)
  --    Schema uses `username` (not email) — see schema.ts. We store the
  --    email as the username so login flow can look up the profile.
  INSERT INTO public.users (id, username, fullname, role, isactive)
  VALUES (v_user_id, admin_email, admin_name, 'ADMIN', true)
  ON CONFLICT (id) DO UPDATE
    SET role     = 'ADMIN',
        fullname = admin_name,
        username = admin_email,
        isactive = true;

  RAISE NOTICE 'Admin ready: % (id=%)', admin_email, v_user_id;
END $$;
