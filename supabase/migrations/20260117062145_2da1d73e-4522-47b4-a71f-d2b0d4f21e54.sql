-- Phase 4: Override Learning System - Add override_decisions table
CREATE TABLE IF NOT EXISTS public.override_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_train_id VARCHAR(20) NOT NULL,
  to_train_id VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(100),
  context JSONB DEFAULT '{}',
  ai_suggestion_used BOOLEAN DEFAULT false,
  outcome_success BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add daily_induction_plans table for Layer 1/2 integration
CREATE TABLE IF NOT EXISTS public.daily_induction_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  for_service JSONB DEFAULT '[]',
  on_standby JSONB DEFAULT '[]',
  in_maintenance JSONB DEFAULT '[]',
  service_schedule JSONB DEFAULT '[]',
  optimization_summary JSONB DEFAULT '{}',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_date)
);

-- Add parking_assignments table for stabling optimization
CREATE TABLE IF NOT EXISTS public.parking_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id),
  plan_date DATE NOT NULL,
  bay_name VARCHAR(50) NOT NULL,
  track_number INTEGER,
  position_in_track INTEGER,
  shunting_moves_required INTEGER DEFAULT 0,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add readiness_scores table for historical tracking
CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainset_id UUID REFERENCES public.trainsets(id) NOT NULL,
  score_date DATE NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  fitness_score NUMERIC(5,2) DEFAULT 0,
  job_card_score NUMERIC(5,2) DEFAULT 0,
  branding_score NUMERIC(5,2) DEFAULT 0,
  mileage_score NUMERIC(5,2) DEFAULT 0,
  cleaning_score NUMERIC(5,2) DEFAULT 0,
  category VARCHAR(20) DEFAULT 'standby',
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.override_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_induction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for override_decisions
CREATE POLICY "Allow authenticated read override_decisions" ON public.override_decisions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert override_decisions" ON public.override_decisions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for daily_induction_plans
CREATE POLICY "Allow authenticated read daily_induction_plans" ON public.daily_induction_plans
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert daily_induction_plans" ON public.daily_induction_plans
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated update daily_induction_plans" ON public.daily_induction_plans
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for parking_assignments
CREATE POLICY "Allow authenticated read parking_assignments" ON public.parking_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert parking_assignments" ON public.parking_assignments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for readiness_scores
CREATE POLICY "Allow authenticated read readiness_scores" ON public.readiness_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert readiness_scores" ON public.readiness_scores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.override_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_induction_plans;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_override_decisions_timestamp ON public.override_decisions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_induction_plans_date ON public.daily_induction_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_trainset_date ON public.readiness_scores(trainset_id, score_date DESC);