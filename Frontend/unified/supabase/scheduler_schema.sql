-- Misting Schedule Schema for Verdanist
-- Create this table in Supabase to persist schedules

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main schedules table
CREATE TABLE IF NOT EXISTS misting_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    zone VARCHAR(1) NOT NULL CHECK (zone IN ('A', 'B')),
    schedule_type VARCHAR(10) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
    duration_minutes INTEGER NOT NULL DEFAULT 5 CHECK (duration_minutes > 0 AND duration_minutes <= 60),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- For daily schedule: store time slots (JSON)
    daily_config JSONB,
    
    -- For weekly schedule: store selected days and time
    weekly_config JSONB,
    
    -- For monthly schedule: store selected dates and time
    monthly_config JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_misting_schedules_user_id ON misting_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_misting_schedules_zone ON misting_schedules(zone);
CREATE INDEX IF NOT EXISTS idx_misting_schedules_enabled ON misting_schedules(is_enabled);

-- Enable Row Level Security
ALTER TABLE misting_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own schedules
CREATE POLICY "Users can manage own schedules" 
    ON misting_schedules 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_misting_schedules_updated_at
    BEFORE UPDATE ON misting_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Schedule execution log (for tracking when schedules actually ran)
CREATE TABLE IF NOT EXISTS schedule_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES misting_schedules(id) ON DELETE CASCADE,
    zone VARCHAR(1) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
    duration_seconds INTEGER,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_schedule_id ON schedule_execution_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_executed_at ON schedule_execution_logs(executed_at);

-- Enable RLS on logs too
ALTER TABLE schedule_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own execution logs" 
    ON schedule_execution_logs 
    FOR SELECT 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM misting_schedules 
        WHERE misting_schedules.id = schedule_execution_logs.schedule_id 
        AND misting_schedules.user_id = auth.uid()
    ));

-- Example data structure for reference:
-- Daily config: {"morning": {"time": "07:00", "enabled": true}, "noon": {"time": "12:00", "enabled": false}, "evening": {"time": "18:00", "enabled": true}}
-- Weekly config: {"days": ["mon", "wed", "fri"], "time": "08:00"}
-- Monthly config: {"dates": [1, 15, 30], "time": "09:00"}
