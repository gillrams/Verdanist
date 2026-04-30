-- Verdanist Supabase Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    farm_name text DEFAULT 'Persada Farm',
    role text DEFAULT 'guest' CHECK (role IN ('admin', 'farmer', 'guest')),
    created_at timestamptz DEFAULT now()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, farm_name, role)
    VALUES (NEW.id, NEW.email,'guest');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- 2. SENSOR READINGS (Time-series, 5-min interval)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zone text NOT NULL CHECK (zone IN ('A','B','C','D')),
    type text NOT NULL CHECK (type IN ('temperature','humidity','soil_moisture')),
    value numeric NOT NULL,
    recorded_at timestamptz DEFAULT now(),
    device_id text DEFAULT 'verdanist-main'
);

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_zone_type_time
    ON public.sensor_readings (zone, type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at
    ON public.sensor_readings (recorded_at DESC);

-- RLS: authenticated users can read; service role inserts
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sensor readings"
    ON public.sensor_readings FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================
-- 3. PUMP LOGS (Event-driven, instant)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pump_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zone text NOT NULL CHECK (zone IN ('A','B','C','D')),
    action text NOT NULL CHECK (action IN ('PUMP ON','PUMP OFF')),
    trigger text NOT NULL CHECK (trigger IN ('manual','auto','timer','schedule')),
    detail text,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pump_logs_zone_created
    ON public.pump_logs (zone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pump_logs_user
    ON public.pump_logs (user_id, created_at DESC);

ALTER TABLE public.pump_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all pump logs"
    ON public.pump_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert pump logs"
    ON public.pump_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- 4. SYSTEM SETTINGS (per-farm config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    humidity_threshold int DEFAULT 72,
    soil_threshold int DEFAULT 60,
    temp_threshold int DEFAULT 28,
    morning_mist bool DEFAULT true,
    midday_soak bool DEFAULT false,
    evening_flush bool DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_user
    ON public.system_settings (user_id);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own settings"
    ON public.system_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. SCHEDULES (Timer slots per zone)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    zone text NOT NULL CHECK (zone IN ('A','B','C','D')),
    time text NOT NULL, -- 'HH:MM' format
    duration int NOT NULL DEFAULT 15, -- minutes
    active bool DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_zone
    ON public.schedules (user_id, zone);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own schedules"
    ON public.schedules FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. DATA RETENTION FUNCTION (run via cron/edge function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_data()
RETURNS void AS $$
BEGIN
    DELETE FROM public.sensor_readings
    WHERE recorded_at < now() - interval '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
