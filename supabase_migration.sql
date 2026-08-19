-- Migration Script to add individual sensor columns to device_settings table
-- Copy and run this in your Supabase SQL Editor

ALTER TABLE public.device_settings
ADD COLUMN IF NOT EXISTS valid_sensors INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS temp_1 FLOAT,
ADD COLUMN IF NOT EXISTS hum_1 FLOAT,
ADD COLUMN IF NOT EXISTS temp_2 FLOAT,
ADD COLUMN IF NOT EXISTS hum_2 FLOAT,
ADD COLUMN IF NOT EXISTS temp_3 FLOAT,
ADD COLUMN IF NOT EXISTS hum_3 FLOAT;
