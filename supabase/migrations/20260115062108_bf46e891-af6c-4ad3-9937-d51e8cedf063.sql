-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;

-- Add missing columns to maintenance_jobs table
ALTER TABLE public.maintenance_jobs ADD COLUMN IF NOT EXISTS maximo_job_id TEXT;
ALTER TABLE public.maintenance_jobs ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;

-- Add missing columns to stabling_positions table
ALTER TABLE public.stabling_positions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.stabling_positions ADD COLUMN IF NOT EXISTS position_name TEXT;

-- Add missing columns to branding_contracts table
ALTER TABLE public.branding_contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.branding_contracts ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 0;

-- Add missing columns to mileage_records table
ALTER TABLE public.mileage_records ADD COLUMN IF NOT EXISTS daily_mileage NUMERIC DEFAULT 0;
ALTER TABLE public.mileage_records ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Add missing columns to optimization_history table
ALTER TABLE public.optimization_history ADD COLUMN IF NOT EXISTS feedback_score NUMERIC;
ALTER TABLE public.optimization_history ADD COLUMN IF NOT EXISTS applied BOOLEAN DEFAULT false;
ALTER TABLE public.optimization_history ADD COLUMN IF NOT EXISTS execution_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create staff_schedules table
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID,
  staff_name TEXT,
  role TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  shift_type TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on staff_schedules
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_schedules
CREATE POLICY "Public read access for staff_schedules" ON public.staff_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for staff_schedules" ON public.staff_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for staff_schedules" ON public.staff_schedules FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for staff_schedules" ON public.staff_schedules FOR DELETE USING (true);