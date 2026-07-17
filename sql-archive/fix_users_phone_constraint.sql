-- =========================================================================
-- SQL FIX: DROP UNIQUE PHONE CONSTRAINT & RECTIFY REGISTRATION TRIGGER
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Drop the unique constraint/index on phone if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;
DROP INDEX IF EXISTS public.users_phone_key;

-- 2. Update registration trigger function to handle NULL phone values properly (avoiding empty string duplicates)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, fullname, role, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'fullName', 'Operator'),
    'OPERATOR',
    CASE WHEN new.phone = '' THEN NULL ELSE new.phone END
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    fullname = EXCLUDED.fullname,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
