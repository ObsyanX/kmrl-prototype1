-- ==========================================
-- PHASE 1: CORE BACKEND INFRASTRUCTURE
-- Multi-Objective Optimization System
-- ==========================================

-- ==========================================
-- ENUM TYPES
-- ==========================================

-- Train status enum
CREATE TYPE train_status AS ENUM (
  'operational',
  'maintenance',
  'cleaning',
  'branding',
  'awaiting_fitness',
  'out_of_service',
  'standby'
);

-- Maintenance job status
CREATE TYPE job_status AS ENUM (
  'pending',
  'scheduled',
  'in_progress',
  'completed',
  'delayed',
  'cancelled'
);

-- Job priority
CREATE TYPE job_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

-- Certificate status
CREATE TYPE certificate_status AS ENUM (
  'valid',
  'expiring_soon',
  'expired',
  'pending_renewal'
);

-- Stabling position status
CREATE TYPE position_status AS ENUM (
  'available',
  'occupied',
  'maintenance',
  'reserved'
);

-- Shift type
CREATE TYPE shift_type AS ENUM (
  'morning',
  'afternoon',
  'night'
);

-- Staff role (extend existing if needed)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE staff_role AS ENUM (
      'driver',
      'conductor',
      'maintenance',
      'supervisor',
      'security',
      'cleaner'
    );
  END IF;
END $$;

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Enhanced trainsets table
DROP TABLE IF EXISTS public.trainsets CASCADE;
CREATE TABLE public.trainsets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status train_status NOT NULL DEFAULT 'operational',
  current_location TEXT,
  total_mileage DECIMAL(10, 2) DEFAULT 0,
  last_maintenance_date TIMESTAMPTZ,
  next_maintenance_date TIMESTAMPTZ,
  fitness_certificate_expiry TIMESTAMPTZ,
  branding_contract_id TEXT,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  last_cleaning_date TIMESTAMPTZ,
  current_stabling_position TEXT,
  operational_hours DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance jobs table
CREATE TABLE public.maintenance_jobs (
  id TEXT PRIMARY KEY,
  trainset_id TEXT NOT NULL REFERENCES public.trainsets(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  priority job_priority NOT NULL DEFAULT 'medium',
  status job_status NOT NULL DEFAULT 'pending',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  estimated_duration INTEGER, -- minutes
  assigned_staff TEXT[],
  description TEXT,
  requirements JSONB DEFAULT '{}',
  completion_notes TEXT,
  maximo_job_id TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fitness certificates table
CREATE TABLE public.fitness_certificates (
  id TEXT PRIMARY KEY,
  trainset_id TEXT NOT NULL REFERENCES public.trainsets(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  status certificate_status NOT NULL DEFAULT 'valid',
  issuing_authority TEXT,
  certificate_number TEXT UNIQUE,
  inspection_details JSONB DEFAULT '{}',
  renewal_reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branding contracts table
CREATE TABLE public.branding_contracts (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  contract_start TIMESTAMPTZ NOT NULL,
  contract_end TIMESTAMPTZ NOT NULL,
  assigned_trainsets TEXT[],
  priority_level INTEGER CHECK (priority_level >= 1 AND priority_level <= 10),
  revenue DECIMAL(12, 2),
  requirements JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff schedules table
CREATE TABLE public.staff_schedules (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  role staff_role NOT NULL,
  shift shift_type NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  assigned_trainset_id TEXT REFERENCES public.trainsets(id) ON DELETE SET NULL,
  assigned_job_id TEXT REFERENCES public.maintenance_jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, date, start_time)
);

-- Stabling positions table
CREATE TABLE public.stabling_positions (
  id TEXT PRIMARY KEY,
  position_name TEXT NOT NULL UNIQUE,
  depot_section TEXT NOT NULL,
  track_number INTEGER,
  position_type TEXT NOT NULL, -- 'maintenance', 'cleaning', 'parking', 'charging'
  capacity INTEGER DEFAULT 1,
  current_occupant TEXT REFERENCES public.trainsets(id) ON DELETE SET NULL,
  status position_status NOT NULL DEFAULT 'available',
  geometry JSONB, -- {x, y, z, rotation} for 3D visualization
  adjacent_positions TEXT[],
  facilities TEXT[], -- ['charging', 'washing', 'inspection_pit']
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mileage tracking table
CREATE TABLE public.mileage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainset_id TEXT NOT NULL REFERENCES public.trainsets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_mileage DECIMAL(10, 2) NOT NULL,
  route_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trainset_id, date)
);

-- Optimization history table
CREATE TABLE public.optimization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  algorithm_version TEXT NOT NULL,
  input_parameters JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  confidence_score DECIMAL(3, 2),
  applied BOOLEAN DEFAULT false,
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  execution_time_ms INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Decision conflicts table
CREATE TABLE public.decision_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id UUID REFERENCES public.optimization_history(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  affected_resources JSONB NOT NULL,
  description TEXT,
  resolution_strategy TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_trainsets_status ON public.trainsets(status);
CREATE INDEX idx_trainsets_fitness_expiry ON public.trainsets(fitness_certificate_expiry);
CREATE INDEX idx_trainsets_next_maintenance ON public.trainsets(next_maintenance_date);

CREATE INDEX idx_maintenance_jobs_trainset ON public.maintenance_jobs(trainset_id);
CREATE INDEX idx_maintenance_jobs_status ON public.maintenance_jobs(status);
CREATE INDEX idx_maintenance_jobs_scheduled ON public.maintenance_jobs(scheduled_start, scheduled_end);

CREATE INDEX idx_fitness_certificates_trainset ON public.fitness_certificates(trainset_id);
CREATE INDEX idx_fitness_certificates_expiry ON public.fitness_certificates(expiry_date);
CREATE INDEX idx_fitness_certificates_status ON public.fitness_certificates(status);

CREATE INDEX idx_staff_schedules_date ON public.staff_schedules(date);
CREATE INDEX idx_staff_schedules_staff ON public.staff_schedules(staff_id, date);

CREATE INDEX idx_stabling_positions_status ON public.stabling_positions(status);
CREATE INDEX idx_stabling_positions_occupant ON public.stabling_positions(current_occupant);

CREATE INDEX idx_mileage_records_trainset_date ON public.mileage_records(trainset_id, date);

CREATE INDEX idx_optimization_history_timestamp ON public.optimization_history(execution_timestamp DESC);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE TRIGGER update_trainsets_updated_at
BEFORE UPDATE ON public.trainsets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_jobs_updated_at
BEFORE UPDATE ON public.maintenance_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fitness_certificates_updated_at
BEFORE UPDATE ON public.fitness_certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branding_contracts_updated_at
BEFORE UPDATE ON public.branding_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at
BEFORE UPDATE ON public.staff_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stabling_positions_updated_at
BEFORE UPDATE ON public.stabling_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE public.trainsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stabling_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_conflicts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all operational data
CREATE POLICY "Authenticated users can view trainsets"
ON public.trainsets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view maintenance jobs"
ON public.maintenance_jobs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view certificates"
ON public.fitness_certificates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view branding contracts"
ON public.branding_contracts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view staff schedules"
ON public.staff_schedules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view stabling positions"
ON public.stabling_positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view mileage records"
ON public.mileage_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view optimization history"
ON public.optimization_history FOR SELECT
TO authenticated
USING (true);

-- Admins and supervisors can manage data
CREATE POLICY "Admins can manage trainsets"
ON public.trainsets FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins can manage maintenance jobs"
ON public.maintenance_jobs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins can manage certificates"
ON public.fitness_certificates FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage branding contracts"
ON public.branding_contracts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage staff schedules"
ON public.staff_schedules FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins can manage stabling positions"
ON public.stabling_positions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create optimization records"
ON public.optimization_history FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- ==========================================
-- REALTIME PUBLICATION
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.trainsets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fitness_certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stabling_positions;