-- =========================================================================
-- APN-CMS SYSTEM DATABASE SCHEMA (Supabase / PostgreSQL DDL)
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- Clean up existing objects if any
DROP TABLE IF EXISTS public.action_logs CASCADE;
DROP TABLE IF EXISTS public.gacp_compliance_checklists CASCADE;
DROP TABLE IF EXISTS public.environmental_logs CASCADE;
DROP TABLE IF EXISTS public.cultivation_logs CASCADE;
DROP TABLE IF EXISTS public.plants CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.role_type CASCADE;
DROP TYPE IF EXISTS public.plant_stage CASCADE;
DROP TYPE IF EXISTS public.batch_status CASCADE;
DROP TYPE IF EXISTS public.room_type CASCADE;

-- 1. Create custom ENUM types matching the GACP / SOP wiki designs
CREATE TYPE public.role_type AS ENUM ('OPERATOR', 'SUPERVISOR', 'AUDITOR', 'ADMIN');
CREATE TYPE public.plant_stage AS ENUM ('CLONE', 'VEG', 'FLOWER', 'HARVESTED', 'ARCHIVED');
CREATE TYPE public.batch_status AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE public.room_type AS ENUM ('CLONING', 'VEG', 'FLOWER', 'DRYING', 'CURING', 'PACKAGING');

-- 2. Create Users / Profiles Table (Linked to Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- References auth.users(id)
    username TEXT UNIQUE NOT NULL,
    fullName TEXT NOT NULL,
    role public.role_type DEFAULT 'OPERATOR'::public.role_type NOT NULL,
    isActive BOOLEAN DEFAULT true NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to users" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Allow users to edit their own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. Create Batches Table
CREATE TABLE public.batches (
    id TEXT PRIMARY KEY, -- e.g., BATCH-2026-W25-SBC
    name TEXT NOT NULL,
    strainName TEXT NOT NULL,
    status public.batch_status DEFAULT 'ACTIVE'::public.batch_status NOT NULL,
    startDate TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    endDate TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to batches" 
ON public.batches FOR SELECT USING (true);

CREATE POLICY "Allow supervisors/admins to modify batches" 
ON public.batches FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPERVISOR')
    )
);

CREATE POLICY "Allow operators to read batches" 
ON public.batches FOR SELECT USING (true);

-- 4. Create Plants Table (Single-plant Traceability QR Level)
CREATE TABLE public.plants (
    id TEXT PRIMARY KEY, -- e.g., APN-CL-0001
    strainName TEXT NOT NULL,
    stage public.plant_stage DEFAULT 'CLONE'::public.plant_stage NOT NULL,
    roomName TEXT NOT NULL,
    plantedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    harvestedAt TIMESTAMP WITH TIME ZONE,
    batchId TEXT REFERENCES public.batches(id) ON DELETE SET NULL,
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Plants
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to plants" 
ON public.plants FOR SELECT USING (true);

CREATE POLICY "Allow operators and above to edit plants" 
ON public.plants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR')
    )
);

-- 5. Create Cultivation Logs (Irrigation & Runoff)
CREATE TABLE public.cultivation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    logDate TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    batchId TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    roomName TEXT NOT NULL,
    waterVolume DOUBLE PRECISION NOT NULL,
    waterUnit TEXT DEFAULT 'liters'::text NOT NULL,
    phIn DOUBLE PRECISION NOT NULL,
    ecIn DOUBLE PRECISION NOT NULL,
    runoffVolume DOUBLE PRECISION,
    phOut DOUBLE PRECISION,
    ecOut DOUBLE PRECISION,
    nutrientsFeed JSONB NOT NULL, -- JSONB stores mixed ratios (ml, ml/gal)
    operatorId UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    notes TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Cultivation Logs
ALTER TABLE public.cultivation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cultivation logs" 
ON public.cultivation_logs FOR SELECT USING (true);

CREATE POLICY "Allow operators to add logs" 
ON public.cultivation_logs FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR')
    )
);

-- 6. Create Environmental Logs
CREATE TABLE public.environmental_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recordedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    roomName TEXT NOT NULL,
    tempC DOUBLE PRECISION NOT NULL,
    humidityRh DOUBLE PRECISION NOT NULL,
    vpd DOUBLE PRECISION,
    ppfd INTEGER,
    dli DOUBLE PRECISION,
    sensorRaw JSONB,
    sensorId TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Environmental Logs
ALTER TABLE public.environmental_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to environmental logs" 
ON public.environmental_logs FOR SELECT USING (true);

CREATE POLICY "Allow insertion of environmental logs" 
ON public.environmental_logs FOR INSERT WITH CHECK (true);

-- 7. Create GACP Compliance Checklist (Dynamic Tasks via JSONB)
CREATE TABLE public.gacp_compliance_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkDate DATE UNIQUE DEFAULT CURRENT_DATE NOT NULL,
    operatorId UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    tasks JSONB NOT NULL, -- e.g. {"hygiene_clothing": true, "tools_sterilized_30m": true}
    hasPestIncident BOOLEAN DEFAULT false NOT NULL,
    incidentDetails TEXT,
    correctiveAction TEXT,
    auditTrail JSONB DEFAULT '[]'::jsonb NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Checklists
ALTER TABLE public.gacp_compliance_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to compliance checklists" 
ON public.gacp_compliance_checklists FOR SELECT USING (true);

CREATE POLICY "Allow operators to write compliance checklists" 
ON public.gacp_compliance_checklists FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR')
    )
);

-- 8. Create Action / Audit Logs
CREATE TABLE public.action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    actionType TEXT NOT NULL,
    operatorId UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    targetType TEXT NOT NULL,
    targetId TEXT NOT NULL,
    plantId TEXT REFERENCES public.plants(id) ON DELETE CASCADE,
    details JSONB NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Action Logs
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to action logs" 
ON public.action_logs FOR SELECT USING (true);

-- 9. Insert Seed Data

-- A. Default Seed User (operator/admin)
-- Note: UUID '00000000-0000-0000-0000-000000000000' is a placeholder for testing
INSERT INTO public.users (id, username, fullName, role, isActive) VALUES
('00000000-0000-0000-0000-000000000000', 'master', 'Master Grower', 'ADMIN', true)
ON CONFLICT (id) DO NOTHING;

-- B. Default Batches
INSERT INTO public.batches (id, name, strainName, status, startDate) VALUES
('BATCH-2026-W25-SBC', 'Super Buff Cherry Bloom #1', 'Super Buff Cherry #23', 'ACTIVE', '2026-06-15 00:00:00+00'),
('BATCH-2026-W26-MNT', 'Menthol Veg Stage #2', 'The Menthol', 'ACTIVE', '2026-06-22 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- C. Default Plants (Traceability Demo)
INSERT INTO public.plants (id, strainName, stage, roomName, plantedAt, batchId) VALUES
('APN-SBC-0001', 'Super Buff Cherry #23', 'VEG', 'Veg Room B', '2026-06-15 00:00:00+00', 'BATCH-2026-W25-SBC'),
('APN-SBC-0002', 'Super Buff Cherry #23', 'VEG', 'Veg Room B', '2026-06-15 00:00:00+00', 'BATCH-2026-W25-SBC'),
('APN-SBC-0003', 'Super Buff Cherry #23', 'FLOWER', 'Flower Room 1', '2026-06-15 00:00:00+00', 'BATCH-2026-W25-SBC'),
('APN-SBC-0004', 'Super Buff Cherry #23', 'FLOWER', 'Flower Room 1', '2026-06-15 00:00:00+00', 'BATCH-2026-W25-SBC'),
('APN-MNT-0001', 'The Menthol', 'CLONE', 'Cloning Dome A', '2026-06-22 00:00:00+00', 'BATCH-2026-W26-MNT'),
('APN-MNT-0002', 'The Menthol', 'CLONE', 'Cloning Dome A', '2026-06-22 00:00:00+00', 'BATCH-2026-W26-MNT')
ON CONFLICT (id) DO NOTHING;

-- D. Initial Environmental Logs
INSERT INTO public.environmental_logs (roomName, tempC, humidityRh, vpd, ppfd, dli) VALUES
('Cloning Dome A', 24.5, 75.0, 0.7, 150, 6.4),
('Veg Room B', 26.0, 60.0, 1.0, 500, 21.6),
('Flower Room 1', 22.0, 58.5, 1.2, 950, 41.0);

-- E. Enable Realtime updates for logs and plants
ALTER PUBLICATION supabase_realtime ADD TABLE public.environmental_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cultivation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gacp_compliance_checklists;
