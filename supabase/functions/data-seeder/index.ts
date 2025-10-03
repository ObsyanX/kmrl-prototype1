import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dataType, days = 90 } = await req.json();

    const results: any = {
      success: true,
      generated: {},
    };

    // Generate historical weather data (90 days)
    if (dataType === 'weather' || dataType === 'all') {
      const weatherData = [];
      const now = Date.now();
      
      for (let i = days; i >= 0; i--) {
        const timestamp = new Date(now - i * 24 * 60 * 60 * 1000);
        
        // Simulate Kochi weather patterns (monsoon season June-Sept)
        const month = timestamp.getMonth();
        const isMonsoon = month >= 5 && month <= 8;
        
        const rainfall = isMonsoon 
          ? Math.random() * 80 + 20  // 20-100mm during monsoon
          : Math.random() * 20;       // 0-20mm otherwise
        
        const temperature = 25 + Math.random() * 8; // 25-33°C
        const humidity = isMonsoon ? 75 + Math.random() * 20 : 60 + Math.random() * 25;
        const windSpeed = Math.random() * 30;
        const visibility = rainfall > 40 ? 2000 + Math.random() * 5000 : 5000 + Math.random() * 5000;

        weatherData.push({
          timestamp: timestamp.toISOString(),
          temperature: Number(temperature.toFixed(2)),
          humidity: Math.floor(humidity),
          rainfall: Number(rainfall.toFixed(2)),
          visibility: Math.floor(visibility),
          wind_speed: Number(windSpeed.toFixed(2)),
          conditions: getWeatherCondition(rainfall, windSpeed),
          weather_severity_score: calculateSeverityScore(rainfall, windSpeed, visibility),
          flooding_risk_score: rainfall > 30 ? Math.min(10, Math.floor(rainfall / 5)) : 0,
          forecast_data: {},
        });
      }

      const { data, error } = await supabase.from('weather_data').insert(weatherData).select();
      if (error) throw error;
      results.generated.weather = data?.length || 0;
    }

    // Generate calendar events
    if (dataType === 'calendar' || dataType === 'all') {
      const events = [
        // Indian holidays
        { event_date: '2025-01-26', event_name: 'Republic Day', event_type: 'holiday', ridership_multiplier: 1.3, expected_demand_factor: 1.3 },
        { event_date: '2025-03-14', event_name: 'Holi', event_type: 'festival', ridership_multiplier: 1.5, expected_demand_factor: 1.5 },
        { event_date: '2025-04-10', event_name: 'Vishu', event_type: 'festival', ridership_multiplier: 1.4, expected_demand_factor: 1.4 },
        { event_date: '2025-08-15', event_name: 'Independence Day', event_type: 'holiday', ridership_multiplier: 1.3, expected_demand_factor: 1.3 },
        { event_date: '2025-10-02', event_name: 'Gandhi Jayanti', event_type: 'holiday', ridership_multiplier: 1.2, expected_demand_factor: 1.2 },
        { event_date: '2025-10-24', event_name: 'Diwali', event_type: 'festival', ridership_multiplier: 1.6, expected_demand_factor: 1.6 },
        { event_date: '2025-12-25', event_name: 'Christmas', event_type: 'holiday', ridership_multiplier: 1.4, expected_demand_factor: 1.4 },
        // Weekends pattern
        { event_date: '2025-11-01', event_name: 'Weekend Peak', event_type: 'special_event', ridership_multiplier: 1.2, expected_demand_factor: 1.2 },
        { event_date: '2025-11-15', event_name: 'Weekend Peak', event_type: 'special_event', ridership_multiplier: 1.2, expected_demand_factor: 1.2 },
      ];

      const { data, error } = await supabase.from('calendar_events').insert(events).select();
      if (error && error.code !== '23505') throw error; // Ignore duplicates
      results.generated.calendar_events = data?.length || 0;
    }

    // Generate operation outcomes (historical learning data)
    if (dataType === 'outcomes' || dataType === 'all') {
      const { data: trainsets } = await supabase.from('trainsets').select('id').limit(10);
      const outcomes = [];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        
        for (const trainset of trainsets || []) {
          // Simulate operation outcomes
          const plannedTime = new Date(date);
          plannedTime.setHours(6, 0, 0, 0);
          
          const actualTime = new Date(plannedTime);
          actualTime.setMinutes(actualTime.getMinutes() + Math.floor((Math.random() - 0.5) * 30));
          
          const predictedDuration = 45 + Math.floor(Math.random() * 30);
          const actualDuration = predictedDuration + Math.floor((Math.random() - 0.5) * 20);
          
          outcomes.push({
            trainset_id: trainset.id,
            planned_induction_time: plannedTime.toISOString(),
            actual_induction_time: actualTime.toISOString(),
            predicted_duration_minutes: predictedDuration,
            actual_duration_minutes: actualDuration,
            deviation_minutes: Math.abs(actualDuration - predictedDuration),
            punctuality_achieved: Math.abs(actualDuration - predictedDuration) < 10,
            weather_impact_predicted: Math.floor(Math.random() * 15),
            weather_impact_actual: Math.floor(Math.random() * 15),
            congestion_impact_predicted: Math.floor(Math.random() * 10),
            congestion_impact_actual: Math.floor(Math.random() * 10),
            predicted_conflicts: Math.floor(Math.random() * 3),
            actual_conflicts: Math.floor(Math.random() * 3),
            success_score: 0.8 + Math.random() * 0.2,
            learning_data: {
              weather_accuracy: 0.85 + Math.random() * 0.15,
              congestion_accuracy: 0.80 + Math.random() * 0.20,
              timing_accuracy: 0.90 + Math.random() * 0.10,
            },
          });
        }
      }

      const { data, error } = await supabase.from('operation_outcomes').insert(outcomes).select();
      if (error) throw error;
      results.generated.operation_outcomes = data?.length || 0;
    }

    // Generate performance metrics
    if (dataType === 'performance' || dataType === 'all') {
      const metrics = [];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        
        // Simulate improving accuracy over time
        const dayProgress = (days - i) / days;
        const baseAccuracy = 0.85 + dayProgress * 0.10; // Improve from 85% to 95%
        
        metrics.push({
          metric_date: date.toISOString().split('T')[0],
          metric_type: 'daily',
          accuracy_percentage: Number((baseAccuracy + (Math.random() - 0.5) * 0.05).toFixed(4)),
          punctuality_rate: Number((0.92 + (Math.random() - 0.5) * 0.08).toFixed(4)),
          maintenance_reduction_rate: Number((0.15 + dayProgress * 0.10).toFixed(4)),
          total_predictions: 25 + Math.floor(Math.random() * 10),
          accurate_predictions: Math.floor((25 + Math.random() * 10) * baseAccuracy),
          weather_prediction_accuracy: Number((0.88 + (Math.random() - 0.5) * 0.10).toFixed(4)),
          demand_prediction_accuracy: Number((0.85 + (Math.random() - 0.5) * 0.10).toFixed(4)),
          total_conflicts_predicted: Math.floor(Math.random() * 5),
          total_conflicts_actual: Math.floor(Math.random() * 5),
          average_deviation_minutes: Number((8 - dayProgress * 3).toFixed(2)),
          ml_model_version: `v1.${Math.floor(dayProgress * 10)}`,
          detailed_metrics: {
            constraint_satisfaction: 0.95 + Math.random() * 0.05,
            optimization_time_ms: 1000 + Math.floor(Math.random() * 2000),
          },
        });
      }

      const { data, error } = await supabase.from('performance_metrics').insert(metrics).select();
      if (error) throw error;
      results.generated.performance_metrics = data?.length || 0;
    }

    // Generate depot congestion patterns
    if (dataType === 'congestion' || dataType === 'all') {
      const congestionData = [];
      
      for (let i = days * 24; i >= 0; i--) { // Hourly data
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
        const hour = timestamp.getHours();
        
        // Peak congestion 5-9 AM and 5-9 PM
        const isPeak = (hour >= 5 && hour <= 9) || (hour >= 17 && hour <= 21);
        const baseCongestion = isPeak ? 6 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3);
        
        congestionData.push({
          timestamp: timestamp.toISOString(),
          depot_section: ['main', 'north', 'south', 'inspection'][Math.floor(Math.random() * 4)],
          congestion_score: baseCongestion,
          traffic_flow: baseCongestion > 7 ? 'congested' : baseCongestion > 4 ? 'moderate' : 'smooth',
          active_shunting_moves: Math.floor(baseCongestion * 1.5),
          available_tracks: 20 - Math.floor(baseCongestion * 1.5),
          estimated_delay_minutes: Math.floor(baseCongestion * 2),
          sensor_data: {
            track_occupancy: baseCongestion / 10,
            movement_frequency: isPeak ? 'high' : 'normal',
          },
        });
      }

      // Insert in batches of 1000
      for (let i = 0; i < congestionData.length; i += 1000) {
        const batch = congestionData.slice(i, i + 1000);
        const { error } = await supabase.from('depot_congestion').insert(batch);
        if (error) throw error;
      }
      
      results.generated.depot_congestion = congestionData.length;
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Data seeder error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateSeverityScore(rainfall: number, windSpeed: number, visibility: number): number {
  let score = 0;
  
  if (rainfall > 40) score += 4;
  else if (rainfall > 25) score += 3;
  else if (rainfall > 10) score += 2;
  else if (rainfall > 5) score += 1;
  
  if (windSpeed > 30) score += 3;
  else if (windSpeed > 20) score += 2;
  else if (windSpeed > 10) score += 1;
  
  if (visibility < 2000) score += 3;
  else if (visibility < 5000) score += 2;
  else if (visibility < 8000) score += 1;
  
  return Math.min(10, score);
}

function getWeatherCondition(rainfall: number, windSpeed: number): string {
  if (rainfall > 30 && windSpeed > 25) return 'storm';
  if (rainfall > 20) return 'heavy_rain';
  if (rainfall > 5) return 'rain';
  if (windSpeed > 30) return 'windy';
  if (rainfall > 0) return 'light_rain';
  return 'clear';
}
