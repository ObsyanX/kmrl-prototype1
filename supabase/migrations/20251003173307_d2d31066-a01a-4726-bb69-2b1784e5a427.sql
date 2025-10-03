-- Create daily_induction_plans table for automated nightly planning
CREATE TABLE IF NOT EXISTS public.daily_induction_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date DATE NOT NULL UNIQUE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  trainsets_for_service TEXT[] NOT NULL,
  trainsets_on_standby TEXT[] NOT NULL,
  trainsets_in_maintenance TEXT[] NOT NULL,
  optimization_summary JSONB DEFAULT '{}'::jsonb,
  weather_context JSONB DEFAULT '{}'::jsonb,
  demand_forecast JSONB DEFAULT '{}'::jsonb,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create accuracy_metrics table for ML performance tracking
CREATE TABLE IF NOT EXISTS public.accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('weather', 'demand', 'failure', 'induction', 'duration', 'conflict')),
  total_predictions INTEGER NOT NULL DEFAULT 0,
  accurate_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_predictions > 0 THEN (accurate_predictions::NUMERIC / total_predictions::NUMERIC) * 100
      ELSE 0
    END
  ) STORED,
  confidence_score_avg NUMERIC(5,2),
  model_version TEXT,
  detailed_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date, prediction_type, model_version)
);

-- Create incidents table for incident management
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT UNIQUE NOT NULL,
  trainset_id TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  title TEXT NOT NULL,
  description TEXT,
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  impact_analysis JSONB DEFAULT '{}'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cleaning_schedules table
CREATE TABLE IF NOT EXISTS public.cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainset_id TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  cleaning_type TEXT NOT NULL CHECK (cleaning_type IN ('routine', 'deep', 'emergency')),
  bay_number TEXT,
  assigned_crew TEXT[],
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  checklist JSONB DEFAULT '{}'::jsonb,
  completion_time TIMESTAMPTZ,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
  notes TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create algorithm_configurations table for rule management
CREATE TABLE IF NOT EXISTS public.algorithm_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT UNIQUE NOT NULL,
  version TEXT NOT NULL,
  weights JSONB NOT NULL DEFAULT '{
    "fitness": 25,
    "maintenance": 25,
    "branding": 15,
    "mileage": 15,
    "staff": 10,
    "stabling": 10
  }'::jsonb,
  constraints JSONB NOT NULL DEFAULT '{
    "fitness_certificates": true,
    "maintenance_schedule": true,
    "branding_priority": true,
    "mileage_balancing": true,
    "staff_availability": true,
    "stabling_geometry": true
  }'::jsonb,
  thresholds JSONB NOT NULL DEFAULT '{
    "mileage_deviation_max": 500,
    "battery_level_min": 20,
    "certificate_expiry_warning_days": 30,
    "maintenance_overdue_hours": 24
  }'::jsonb,
  ml_parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.daily_induction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_induction_plans
CREATE POLICY "Authenticated users can view induction plans"
  ON public.daily_induction_plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage induction plans"
  ON public.daily_induction_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- RLS Policies for accuracy_metrics
CREATE POLICY "Authenticated users can view accuracy metrics"
  ON public.accuracy_metrics FOR SELECT
  USING (true);

CREATE POLICY "System can insert accuracy metrics"
  ON public.accuracy_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage accuracy metrics"
  ON public.accuracy_metrics FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for incidents
CREATE POLICY "Authenticated users can view incidents"
  ON public.incidents FOR SELECT
  USING (true);

CREATE POLICY "Users can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage incidents"
  ON public.incidents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- RLS Policies for cleaning_schedules
CREATE POLICY "Authenticated users can view cleaning schedules"
  ON public.cleaning_schedules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cleaning schedules"
  ON public.cleaning_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- RLS Policies for algorithm_configurations
CREATE POLICY "Authenticated users can view algorithm configs"
  ON public.algorithm_configurations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage algorithm configs"
  ON public.algorithm_configurations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cleaning_schedules_updated_at
  BEFORE UPDATE ON public.cleaning_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_algorithm_configurations_updated_at
  BEFORE UPDATE ON public.algorithm_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default algorithm configuration
INSERT INTO public.algorithm_configurations (config_name, version, is_active)
VALUES ('default_hierarchical_optimizer', '2.0.0', true)
ON CONFLICT (config_name) DO NOTHING;