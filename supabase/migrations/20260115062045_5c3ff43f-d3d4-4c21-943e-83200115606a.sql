-- Create trainsets table
CREATE TABLE public.trainsets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  train_id TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  total_mileage NUMERIC DEFAULT 0,
  battery_level NUMERIC DEFAULT 100,
  operational_hours NUMERIC DEFAULT 0,
  home_bay TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fitness_certificates table
CREATE TABLE public.fitness_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_jobs table
CREATE TABLE public.maintenance_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create branding_contracts table
CREATE TABLE public.branding_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  contract_name TEXT NOT NULL,
  hours_current NUMERIC DEFAULT 0,
  hours_required NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stabling_positions table
CREATE TABLE public.stabling_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  bay_name TEXT NOT NULL,
  position_type TEXT DEFAULT 'standard',
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaning_schedules table
CREATE TABLE public.cleaning_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  cleaning_type TEXT NOT NULL DEFAULT 'standard',
  hours_required NUMERIC DEFAULT 0,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mileage_records table
CREATE TABLE public.mileage_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  mileage NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity TEXT DEFAULT 'low',
  description TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accuracy_metrics table
CREATE TABLE public.accuracy_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_version TEXT,
  total_predictions INTEGER DEFAULT 0,
  accurate_predictions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ridership_multiplier NUMERIC DEFAULT 1,
  expected_demand_factor NUMERIC DEFAULT 1,
  notes TEXT,
  fleet_adjustment_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create depot_congestion table
CREATE TABLE public.depot_congestion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  depot_section TEXT NOT NULL,
  congestion_score NUMERIC DEFAULT 0,
  active_shunting_moves INTEGER DEFAULT 0,
  available_tracks INTEGER DEFAULT 0,
  traffic_flow TEXT DEFAULT 'smooth',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  estimated_delay_minutes INTEGER DEFAULT 0,
  sensor_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weather_data table
CREATE TABLE public.weather_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  temperature NUMERIC,
  precipitation NUMERIC,
  wind_speed NUMERIC,
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operation_outcomes table
CREATE TABLE public.operation_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
  actual_induction_time TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INTEGER,
  actual_conflicts INTEGER DEFAULT 0,
  weather_impact_actual NUMERIC DEFAULT 0,
  congestion_impact_actual NUMERIC DEFAULT 0,
  punctuality_achieved BOOLEAN DEFAULT true,
  deviation_minutes INTEGER DEFAULT 0,
  success_score NUMERIC DEFAULT 0,
  learning_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create optimization_history table
CREATE TABLE public.optimization_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimization_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  results JSONB DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decision_conflicts table
CREATE TABLE public.decision_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conflict_type TEXT NOT NULL,
  trainset_ids TEXT[],
  description TEXT,
  severity TEXT DEFAULT 'low',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_strategy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.trainsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stabling_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depot_congestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_conflicts ENABLE ROW LEVEL SECURITY;

-- Create public read policies for operational data (fleet management system)
CREATE POLICY "Public read access for trainsets" ON public.trainsets FOR SELECT USING (true);
CREATE POLICY "Public read access for fitness_certificates" ON public.fitness_certificates FOR SELECT USING (true);
CREATE POLICY "Public read access for maintenance_jobs" ON public.maintenance_jobs FOR SELECT USING (true);
CREATE POLICY "Public read access for branding_contracts" ON public.branding_contracts FOR SELECT USING (true);
CREATE POLICY "Public read access for stabling_positions" ON public.stabling_positions FOR SELECT USING (true);
CREATE POLICY "Public read access for cleaning_schedules" ON public.cleaning_schedules FOR SELECT USING (true);
CREATE POLICY "Public read access for mileage_records" ON public.mileage_records FOR SELECT USING (true);
CREATE POLICY "Public read access for incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Public read access for accuracy_metrics" ON public.accuracy_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for calendar_events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Public read access for depot_congestion" ON public.depot_congestion FOR SELECT USING (true);
CREATE POLICY "Public read access for weather_data" ON public.weather_data FOR SELECT USING (true);
CREATE POLICY "Public read access for operation_outcomes" ON public.operation_outcomes FOR SELECT USING (true);
CREATE POLICY "Public read access for optimization_history" ON public.optimization_history FOR SELECT USING (true);
CREATE POLICY "Public read access for decision_conflicts" ON public.decision_conflicts FOR SELECT USING (true);
CREATE POLICY "Public read access for audit_log" ON public.audit_log FOR SELECT USING (true);

-- Create insert/update/delete policies for authenticated users
CREATE POLICY "Authenticated insert for trainsets" ON public.trainsets FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for trainsets" ON public.trainsets FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for trainsets" ON public.trainsets FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for fitness_certificates" ON public.fitness_certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for fitness_certificates" ON public.fitness_certificates FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for fitness_certificates" ON public.fitness_certificates FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for maintenance_jobs" ON public.maintenance_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for maintenance_jobs" ON public.maintenance_jobs FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for maintenance_jobs" ON public.maintenance_jobs FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for branding_contracts" ON public.branding_contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for branding_contracts" ON public.branding_contracts FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for branding_contracts" ON public.branding_contracts FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for stabling_positions" ON public.stabling_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for stabling_positions" ON public.stabling_positions FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for stabling_positions" ON public.stabling_positions FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for cleaning_schedules" ON public.cleaning_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for cleaning_schedules" ON public.cleaning_schedules FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for cleaning_schedules" ON public.cleaning_schedules FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for mileage_records" ON public.mileage_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for mileage_records" ON public.mileage_records FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for mileage_records" ON public.mileage_records FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for incidents" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for incidents" ON public.incidents FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for accuracy_metrics" ON public.accuracy_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for accuracy_metrics" ON public.accuracy_metrics FOR UPDATE USING (true);

CREATE POLICY "Authenticated insert for audit_log" ON public.audit_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated insert for calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for calendar_events" ON public.calendar_events FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for calendar_events" ON public.calendar_events FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for depot_congestion" ON public.depot_congestion FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for depot_congestion" ON public.depot_congestion FOR UPDATE USING (true);

CREATE POLICY "Authenticated insert for weather_data" ON public.weather_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for weather_data" ON public.weather_data FOR UPDATE USING (true);

CREATE POLICY "Authenticated insert for operation_outcomes" ON public.operation_outcomes FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for operation_outcomes" ON public.operation_outcomes FOR UPDATE USING (true);

CREATE POLICY "Authenticated insert for optimization_history" ON public.optimization_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for optimization_history" ON public.optimization_history FOR UPDATE USING (true);

CREATE POLICY "Authenticated insert for decision_conflicts" ON public.decision_conflicts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for decision_conflicts" ON public.decision_conflicts FOR UPDATE USING (true);

-- Profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_trainsets_updated_at BEFORE UPDATE ON public.trainsets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_jobs_updated_at BEFORE UPDATE ON public.maintenance_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();