-- Add missing columns to trainsets table for advanced optimization
ALTER TABLE trainsets 
ADD COLUMN IF NOT EXISTS component_health_score NUMERIC DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS iot_sensor_alerts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS historical_performance JSONB DEFAULT '[]'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainsets_health_score ON trainsets(component_health_score);
CREATE INDEX IF NOT EXISTS idx_trainsets_last_service ON trainsets(last_service_date);

-- Add comment
COMMENT ON COLUMN trainsets.component_health_score IS 'Overall component health score (0-100)';
COMMENT ON COLUMN trainsets.iot_sensor_alerts IS 'Array of IoT sensor alerts';
COMMENT ON COLUMN trainsets.historical_performance IS 'Historical performance data for ML predictions';