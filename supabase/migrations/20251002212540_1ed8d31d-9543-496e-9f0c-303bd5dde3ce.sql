-- =====================================================
-- PHASE 3: ADVANCED ALGORITHM TABLES
-- =====================================================

-- 1. Weather Data Table (Real-time & Historical Weather)
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  temperature NUMERIC(5,2),
  humidity INTEGER CHECK (humidity >= 0 AND humidity <= 100),
  rainfall NUMERIC(6,2) DEFAULT 0,
  visibility INTEGER,
  wind_speed NUMERIC(5,2),
  flooding_risk_score INTEGER CHECK (flooding_risk_score >= 0 AND flooding_risk_score <= 10),
  weather_severity_score INTEGER CHECK (weather_severity_score >= 0 AND weather_severity_score <= 10),
  conditions TEXT,
  forecast_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weather_timestamp ON public.weather_data(timestamp DESC);

-- 2. Depot Congestion Table (IoT & Traffic Monitoring)
CREATE TABLE IF NOT EXISTS public.depot_congestion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  depot_section TEXT NOT NULL,
  congestion_score INTEGER CHECK (congestion_score >= 0 AND congestion_score <= 10),
  active_shunting_moves INTEGER DEFAULT 0,
  available_tracks INTEGER DEFAULT 0,
  estimated_delay_minutes INTEGER DEFAULT 0,
  sensor_data JSONB DEFAULT '{}',
  traffic_flow TEXT CHECK (traffic_flow IN ('clear', 'moderate', 'congested', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_congestion_timestamp ON public.depot_congestion(timestamp DESC);
CREATE INDEX idx_congestion_section ON public.depot_congestion(depot_section);

-- 3. Calendar Events (Holidays, Festivals, Demand Forecasting)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('holiday', 'festival', 'special_event', 'maintenance_window')),
  expected_demand_factor NUMERIC(3,2) DEFAULT 1.0 CHECK (expected_demand_factor >= 0.5 AND expected_demand_factor <= 2.0),
  ridership_multiplier NUMERIC(3,2) DEFAULT 1.0,
  fleet_adjustment_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_event_date ON public.calendar_events(event_date);

-- 4. Operation Outcomes (ML Learning & Continuous Improvement)
CREATE TABLE IF NOT EXISTS public.operation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id UUID REFERENCES public.optimization_history(id),
  trainset_id TEXT NOT NULL,
  planned_induction_time TIMESTAMP WITH TIME ZONE,
  actual_induction_time TIMESTAMP WITH TIME ZONE,
  predicted_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  predicted_conflicts INTEGER DEFAULT 0,
  actual_conflicts INTEGER DEFAULT 0,
  weather_impact_predicted INTEGER,
  weather_impact_actual INTEGER,
  congestion_impact_predicted INTEGER,
  congestion_impact_actual INTEGER,
  punctuality_achieved BOOLEAN DEFAULT true,
  deviation_minutes INTEGER DEFAULT 0,
  success_score NUMERIC(5,2) CHECK (success_score >= 0 AND success_score <= 100),
  learning_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outcomes_optimization ON public.operation_outcomes(optimization_id);
CREATE INDEX idx_outcomes_trainset ON public.operation_outcomes(trainset_id);
CREATE INDEX idx_outcomes_created ON public.operation_outcomes(created_at DESC);

-- 5. Performance Metrics (99.5% Accuracy Tracking)
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('daily', 'weekly', 'monthly')),
  total_predictions INTEGER DEFAULT 0,
  accurate_predictions INTEGER DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) DEFAULT 0,
  punctuality_rate NUMERIC(5,2) DEFAULT 0,
  maintenance_reduction_rate NUMERIC(5,2) DEFAULT 0,
  average_deviation_minutes NUMERIC(6,2) DEFAULT 0,
  total_conflicts_predicted INTEGER DEFAULT 0,
  total_conflicts_actual INTEGER DEFAULT 0,
  weather_prediction_accuracy NUMERIC(5,2) DEFAULT 0,
  demand_prediction_accuracy NUMERIC(5,2) DEFAULT 0,
  ml_model_version TEXT,
  detailed_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_date ON public.performance_metrics(metric_date DESC);
CREATE INDEX idx_metrics_type ON public.performance_metrics(metric_type);

-- Enable RLS on all new tables
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depot_congestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can view, Admins can manage
CREATE POLICY "Authenticated users can view weather data"
  ON public.weather_data FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage weather data"
  ON public.weather_data FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view congestion data"
  ON public.depot_congestion FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage congestion data"
  ON public.depot_congestion FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view calendar events"
  ON public.calendar_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage calendar events"
  ON public.calendar_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Authenticated users can view operation outcomes"
  ON public.operation_outcomes FOR SELECT
  USING (true);

CREATE POLICY "System can insert operation outcomes"
  ON public.operation_outcomes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage operation outcomes"
  ON public.operation_outcomes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view performance metrics"
  ON public.performance_metrics FOR SELECT
  USING (true);

CREATE POLICY "System can insert performance metrics"
  ON public.performance_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage performance metrics"
  ON public.performance_metrics FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();