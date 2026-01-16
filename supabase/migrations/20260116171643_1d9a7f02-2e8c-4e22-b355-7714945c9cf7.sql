-- Create induction_plans table for real Gantt scheduling
CREATE TABLE IF NOT EXISTS public.induction_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainset_id UUID REFERENCES public.trainsets(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    shift_type TEXT NOT NULL DEFAULT 'morning', -- 'early_morning', 'morning', 'afternoon', 'night'
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    platform_id UUID REFERENCES public.stabling_positions(id),
    assigned_crew JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled', 'delayed'
    priority TEXT NOT NULL DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
    ai_confidence NUMERIC(4,3) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    ai_reasoning TEXT,
    blocking_issues JSONB DEFAULT '[]'::jsonb,
    constraint_violations JSONB DEFAULT '[]'::jsonb,
    risk_score NUMERIC(3,2) DEFAULT 0,
    turnaround_minutes INTEGER DEFAULT 15,
    headway_buffer_minutes INTEGER DEFAULT 3,
    power_block_required BOOLEAN DEFAULT false,
    safety_clearance_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    override_reason TEXT,
    overridden_by UUID,
    overridden_at TIMESTAMP WITH TIME ZONE,
    locked BOOLEAN DEFAULT false,
    locked_by UUID,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crew_assignments table for detailed crew tracking
CREATE TABLE IF NOT EXISTS public.crew_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    induction_plan_id UUID REFERENCES public.induction_plans(id) ON DELETE CASCADE,
    staff_id UUID,
    staff_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'driver', 'technician', 'supervisor', 'safety_officer'
    duty_start_time TIME NOT NULL,
    duty_end_time TIME NOT NULL,
    rest_hours_before_shift NUMERIC(4,2),
    certification_valid BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'assigned', -- 'assigned', 'confirmed', 'on_duty', 'off_duty', 'unavailable'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create constraint_rules table for editable rules engine
CREATE TABLE IF NOT EXISTS public.constraint_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_category TEXT NOT NULL, -- 'platform', 'headway', 'crew_rest', 'safety', 'turnaround', 'priority'
    rule_type TEXT NOT NULL DEFAULT 'hard', -- 'hard' (must satisfy), 'soft' (preference)
    description TEXT,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    weight NUMERIC(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    violation_penalty NUMERIC DEFAULT 100,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create simulation_scenarios table for what-if analysis
CREATE TABLE IF NOT EXISTS public.simulation_scenarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_name TEXT NOT NULL,
    scenario_type TEXT NOT NULL, -- 'breakdown', 'weather_disruption', 'staff_shortage', 'peak_demand', 'custom'
    input_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    baseline_plan_id UUID REFERENCES public.induction_plans(id),
    simulation_results JSONB,
    feasibility_score NUMERIC(4,3),
    delay_propagation_minutes INTEGER,
    throughput_change_percent NUMERIC(5,2),
    risk_assessment JSONB,
    comparison_metrics JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_actions table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS public.audit_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL, -- 'plan_created', 'plan_approved', 'plan_overridden', 'constraint_violated', 'safety_alert'
    entity_type TEXT NOT NULL, -- 'induction_plan', 'constraint_rule', 'crew_assignment', 'simulation'
    entity_id UUID NOT NULL,
    user_id UUID,
    user_role TEXT,
    action_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_state JSONB,
    new_state JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_explanations table for explainable AI
CREATE TABLE IF NOT EXISTS public.ai_explanations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    induction_plan_id UUID REFERENCES public.induction_plans(id) ON DELETE CASCADE,
    explanation_type TEXT NOT NULL, -- 'constraint_binding', 'bottleneck', 'risk_factor', 'override_impact'
    active_constraints JSONB DEFAULT '[]'::jsonb,
    binding_bottleneck TEXT,
    risk_factors JSONB DEFAULT '[]'::jsonb,
    confidence_breakdown JSONB,
    what_if_impact JSONB,
    override_consequences JSONB,
    natural_language_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.induction_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_actions;

-- Add RLS policies
ALTER TABLE public.induction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraint_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Authenticated read for induction_plans" ON public.induction_plans FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for induction_plans" ON public.induction_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for induction_plans" ON public.induction_plans FOR UPDATE USING (true);

CREATE POLICY "Authenticated read for crew_assignments" ON public.crew_assignments FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for crew_assignments" ON public.crew_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for crew_assignments" ON public.crew_assignments FOR UPDATE USING (true);

CREATE POLICY "Authenticated read for constraint_rules" ON public.constraint_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for constraint_rules" ON public.constraint_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for constraint_rules" ON public.constraint_rules FOR UPDATE USING (true);

CREATE POLICY "Authenticated read for simulation_scenarios" ON public.simulation_scenarios FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for simulation_scenarios" ON public.simulation_scenarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated read for audit_actions" ON public.audit_actions FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for audit_actions" ON public.audit_actions FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated read for ai_explanations" ON public.ai_explanations FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for ai_explanations" ON public.ai_explanations FOR INSERT WITH CHECK (true);

-- Create update trigger for induction_plans
CREATE TRIGGER update_induction_plans_updated_at
    BEFORE UPDATE ON public.induction_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for constraint_rules
CREATE TRIGGER update_constraint_rules_updated_at
    BEFORE UPDATE ON public.constraint_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default constraint rules
INSERT INTO public.constraint_rules (rule_name, rule_category, rule_type, description, parameters, weight, violation_penalty) VALUES
('Platform Exclusivity', 'platform', 'hard', 'Only one train can occupy a platform at a time', '{"max_occupancy": 1, "buffer_minutes": 5}', 1.0, 1000),
('Headway Minimum', 'headway', 'hard', 'Minimum time between successive train departures', '{"min_headway_seconds": 180, "peak_headway_seconds": 120}', 1.0, 500),
('Crew Rest Requirement', 'crew_rest', 'hard', 'Minimum rest hours between shifts', '{"min_rest_hours": 8, "max_continuous_duty_hours": 12}', 1.0, 800),
('Safety Margin', 'safety', 'hard', 'Buffer time for safety checks', '{"pre_departure_check_minutes": 10, "post_arrival_check_minutes": 5}', 1.0, 900),
('Turnaround Buffer', 'turnaround', 'soft', 'Time for train turnaround at terminus', '{"min_turnaround_minutes": 15, "ideal_turnaround_minutes": 20}', 0.8, 200),
('Priority Weighting', 'priority', 'soft', 'Weight for priority trains (express, branded)', '{"express_multiplier": 1.5, "branded_multiplier": 1.2}', 0.6, 100),
('Power Block Window', 'safety', 'hard', 'Time windows when power is available', '{"power_available_start": "05:30", "power_available_end": "23:30"}', 1.0, 1000),
('Signal Block Constraint', 'safety', 'hard', 'Signal block clearance requirements', '{"block_clear_time_seconds": 60}', 1.0, 900);