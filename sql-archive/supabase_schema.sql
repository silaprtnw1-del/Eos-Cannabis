-- =========================================================================
-- PHANNAPHA FARM - GACP & SOP SYSTEM DATABASE SCHEMA
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor -> New Query
-- =========================================================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'master_grower', 'grower', 'auditor')) DEFAULT 'grower',
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create Rooms Table
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('clone', 'veg', 'bloom', 'drying')) NOT NULL,
    target_temp_c NUMERIC(4,2) DEFAULT 25.0,
    target_humidity_pct NUMERIC(4,2) DEFAULT 60.0,
    target_vpd_kpa NUMERIC(4,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to rooms" 
ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Allow only admins/master growers to modify rooms" 
ON public.rooms FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master_grower')
    )
);

-- 3. Create Batches Table
CREATE TABLE public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    batch_code TEXT UNIQUE NOT NULL,
    strain_name TEXT NOT NULL,
    stage TEXT CHECK (stage IN ('clone', 'veg', 'bloom', 'harvest')) DEFAULT 'clone',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    projected_harvest_date TIMESTAMP WITH TIME ZONE,
    actual_harvest_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to batches" 
ON public.batches FOR SELECT USING (true);

CREATE POLICY "Allow growers and masters to modify batches" 
ON public.batches FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master_grower', 'grower')
    )
);

-- 4. Create Telemetry Logs Table (Real-time and Historical Sensor Data)
CREATE TABLE public.telemetry_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    temperature_c NUMERIC(4,2) NOT NULL,
    humidity_pct NUMERIC(4,2) NOT NULL,
    vpd_kpa NUMERIC(4,2) NOT NULL,
    ppfd NUMERIC(6,2),
    logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for Telemetry
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to telemetry" 
ON public.telemetry_logs FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert telemetry" 
ON public.telemetry_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Create Nutrient Logs Table (Athena Nutrient Feeding Mix Logs)
CREATE TABLE public.nutrient_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ec NUMERIC(4,2) NOT NULL,
    ppm NUMERIC(6,2),
    ph NUMERIC(4,2) NOT NULL,
    batch_volume_liters NUMERIC(6,2) NOT NULL,
    feeding_phase TEXT NOT NULL,
    recipe_details JSONB,
    mixed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for Nutrient Logs
ALTER TABLE public.nutrient_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to nutrient logs" 
ON public.nutrient_logs FOR SELECT USING (true);

CREATE POLICY "Allow growers to log nutrient mixings" 
ON public.nutrient_logs FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master_grower', 'grower')
    )
);

-- 6. Create SOP Tasks Table (Daily GACP Compliance Checklists)
CREATE TABLE public.sop_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    task_title_th TEXT NOT NULL,
    task_title_en TEXT NOT NULL,
    category TEXT CHECK (category IN ('hygiene', 'cultivation', 'cloning', 'qc')) NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT
);

-- Enable RLS for SOP Tasks
ALTER TABLE public.sop_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to SOP tasks" 
ON public.sop_tasks FOR SELECT USING (true);

CREATE POLICY "Allow growers to update task completion" 
ON public.sop_tasks FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master_grower', 'grower')
    )
);

-- 7. Add Seed Data (Initial Default Rooms)
INSERT INTO public.rooms (name, type, target_temp_c, target_humidity_pct, target_vpd_kpa) VALUES
('Clone Dome A', 'clone', 24.5, 75.0, 0.7),
('Vegetative Room', 'veg', 26.0, 60.0, 1.0),
('Bloom Room 1', 'bloom', 22.0, 58.5, 1.2);

-- 8. Enable Realtime updates for Telemetry & Rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
